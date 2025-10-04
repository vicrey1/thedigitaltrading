const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Investment = require('../models/Investment');
const AuditLog = require('../models/AuditLog');

// Middleware to verify admin mirror token
const verifyMirrorToken = async (req, res, next) => {
    const isImpersonated = req.user && req.user.decoded && req.user.decoded.impersonation === true;
    if (!isImpersonated) {
        return res.status(403).json({ message: 'This action is only allowed in admin mirror (impersonation) mode.' });
    }
    next();
};

// POST /api/mirror-investment/adjust-gain
router.post('/adjust-gain', auth, verifyMirrorToken, async (req, res) => {
    try {
        const { investmentId, amount, reason } = req.body;

        if (typeof amount !== 'number' || isNaN(amount)) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const investment = await Investment.findById(investmentId);
        if (!investment) {
            return res.status(404).json({ message: 'Investment not found' });
        }

        // Verify the investment belongs to the mirrored user
        if (investment.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to modify this investment' });
        }

        // Calculate new values
        const oldValue = investment.currentValue || investment.amount;
        const newValue = oldValue + amount;

        // Update investment
        investment.currentValue = newValue;
        investment.lastValueUpdate = new Date();

        // Add ROI transaction
        investment.transactions = investment.transactions || [];
        investment.transactions.push({
            type: 'roi',
            amount: amount,
            date: new Date(),
            description: reason || 'Admin adjusted gain/loss',
            meta: {
                adjustedBy: req.user.decoded.impersonatedBy,
                oldValue,
                newValue
            }
        });

        await investment.save();

        // Create audit log
        try {
            await AuditLog.create({
                userId: req.user.decoded.impersonatedBy,
                action: 'mirror_adjust_investment',
                targetId: investment._id,
                details: `Admin adjusted investment ${investmentId} by ${amount} (${reason || 'no reason provided'})`,
                changes: {
                    oldValue,
                    newValue,
                    difference: amount
                },
                createdAt: new Date()
            });
        } catch (e) {
            console.error('Audit log creation failed:', e);
        }

        return res.json({
            message: 'Investment value adjusted successfully',
            investment: {
                id: investment._id,
                oldValue,
                newValue,
                difference: amount,
                lastUpdate: investment.lastValueUpdate
            }
        });

    } catch (err) {
        console.error('[MIRROR INVESTMENT] Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/mirror-investment/:id/history
router.get('/:id/history', auth, verifyMirrorToken, async (req, res) => {
    try {
        const { id } = req.params;
        const investment = await Investment.findOne({
            _id: id,
            userId: req.user.id
        });

        if (!investment) {
            return res.status(404).json({ message: 'Investment not found' });
        }

        const adjustments = (investment.transactions || [])
            .filter(t => t.type === 'roi' && t.meta?.adjustedBy)
            .map(t => ({
                amount: t.amount,
                date: t.date,
                reason: t.description,
                adjustedBy: t.meta.adjustedBy,
                oldValue: t.meta.oldValue,
                newValue: t.meta.newValue
            }));

        return res.json({ adjustments });
    } catch (err) {
        console.error('[MIRROR INVESTMENT HISTORY] Error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
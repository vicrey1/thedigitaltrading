import React, { useEffect, useState } from 'react';
import axios from 'axios';
import FundList from '../../components/admin/FundList';

const InvestmentFunds = () => {
	const [funds, setFunds] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchFunds = async () => {
			try {
				const res = await axios.get('/api/admin/funds', { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });
				setFunds(res.data || []);
			} catch (e) {
				setFunds([]);
			} finally {
				setLoading(false);
			}
		};
		fetchFunds();
	}, []);

	const handleEdit = (fund) => {
		// open modal / navigate to editor - placeholder
		alert('Open editor for ' + (fund.name || fund._id));
	};

	if (loading) return <div className="p-4">Loading funds...</div>;

	return (
		<div className="p-2 sm:p-4 md:p-6 max-w-full sm:max-w-4xl mx-auto">
			<h1 className="text-2xl font-bold mb-4">Investment Funds</h1>
			<FundList funds={funds} onEdit={handleEdit} />
		</div>
	);
};

export default InvestmentFunds;

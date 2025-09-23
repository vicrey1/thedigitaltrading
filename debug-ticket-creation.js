const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/luxyield');

const SupportTicket = require('./server/models/SupportTicket');

async function testTicketCreation() {
  try {
    console.log('Testing ticket creation...');
    
    const ticket = new SupportTicket({
      userId: new mongoose.Types.ObjectId(), // dummy user ID
      subject: 'Test Support Ticket',
      description: 'This is a test description for the support system that meets the minimum length requirement.',
      category: 'general',
      priority: 'medium'
    });

    console.log('Ticket before save:', {
      ticketId: ticket.ticketId,
      subject: ticket.subject,
      userId: ticket.userId
    });

    await ticket.save();
    
    console.log('✅ Ticket created successfully!');
    console.log('Ticket ID:', ticket.ticketId);
    console.log('MongoDB _id:', ticket._id);
    
  } catch (error) {
    console.error('❌ Error creating ticket:', error.message);
    console.error('Full error:', error);
  } finally {
    mongoose.connection.close();
  }
}

testTicketCreation();
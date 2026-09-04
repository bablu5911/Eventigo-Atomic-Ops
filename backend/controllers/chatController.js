const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

const getMessages = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let query = {};
  if (userRole === 'admin' || userRole === 'superadmin') {
    // Admin & Super Admin see all broadcast messages and direct messages involving them
    query = {};
  } else {
    // Other roles see broadcasts + direct messages to/from them
    query = {
      $or: [
        { isBroadcast: true },
        { sender: userId },
        { recipient: userId }
      ]
    };
  }

  const messages = await ChatMessage.find(query).sort({ createdAt: 1 });
  res.status(200).json({
    success: true,
    messages
  });
};

const sendMessage = async (req, res) => {
  const { recipientId, message, isBroadcast, type } = req.body;
  const senderId = req.user.id;
  const senderUser = await User.findById(senderId);

  let recipientName = 'All Team Members';
  let targetRecipientId = null;

  if (!isBroadcast && recipientId) {
    const targetUser = await User.findById(recipientId);
    if (!targetUser) {
      throw new ApiError(404, 'Recipient user not found');
    }
    recipientName = targetUser.name;
    targetRecipientId = targetUser._id;
  }

  const chatMessage = await ChatMessage.create({
    sender: senderId,
    senderName: senderUser.name,
    senderRole: senderUser.role,
    recipient: targetRecipientId,
    recipientName,
    message,
    isBroadcast: Boolean(isBroadcast),
    type: type || 'general'
  });

  res.status(201).json({
    success: true,
    message: isBroadcast ? 'Broadcast message dispatched' : 'Direct message sent',
    chatMessage
  });
};

module.exports = {
  getMessages,
  sendMessage
};

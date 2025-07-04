const expressAsyncHandler = require("express-async-handler");
const Message = require("../models/messageModel");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

const sendMessage = expressAsyncHandler(async (req,res)=>{
    const  {content , chatId} = req.body;

    if(!content || !chatId){
        console.log("Invalid data passed into request");
        return res.sendStatus(400);
    }

    var newMessage = {
        sender : req.user._id,
        content : content,
        chat : chatId
    }

    try {
        let message = await Message.create(newMessage);

        message = await message.populate("sender", "name pic");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email",
        });
        await Chat.findByIdAndUpdate(req.body.chatId , {
            latestMessage : message
        }) ;
        
        res.json(message)
    }
     catch (error) {
        res.status(400);
        throw new Error(error.message) ;
    }
})

const allMessages = expressAsyncHandler(async(req, res)=>{
    try {
        const messages = await Message.find({chat : req.params.chatId})
        .populate("sender" , "name pic email")
        .populate("chat");    

        res.json(messages) ;
    }
     catch (error) {
        res.status(400); 
        throw new Error(error.message) ;
    }
})

const editMessage = expressAsyncHandler(async(req, res)=>{
    const {messageId, content} = req.body;

    if(!messageId || !content){
        res.status(400);
        throw new Error("Message ID and content are required");
    }

    try {
        const message = await Message.findById(messageId);
        
        if(!message){
            res.status(404);
            throw new Error("Message not found");
        }

        if(message.sender.toString() !== req.user._id.toString()){
            res.status(403);
            throw new Error("You can only edit your own messages");
        }

        if(!message.isEdited){
            message.editHistory.push({
                content: message.content,
                editedAt: new Date(),
                editedBy: req.user._id
            });
        }

        message.content = content;
        message.isEdited = true;
        
        message.editHistory.push({
            content: content,
            editedAt: new Date(),
            editedBy: req.user._id
        });

        await message.save();

        await message.populate("sender", "name pic email");
        await message.populate("chat");

        const io = req.app.get('io');
        if (io && message.chat) {
            io.to(message.chat._id ? message.chat._id.toString() : message.chat.toString()).emit("message edited", message);
        }

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
});

module.exports = {sendMessage, allMessages, editMessage};
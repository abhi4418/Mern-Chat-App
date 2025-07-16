import React, { useEffect, useState } from 'react'
import { ChatState } from '../Context/ChatProvider'
import { Box, FormControl, IconButton, Input, Spinner, Text, useToast } from '@chakra-ui/react'
import { ArrowBackIcon } from '@chakra-ui/icons'
import { getSender , getSenderFull } from '../config/ChatLogics'
import ProfileModal from './misc/ProfileModal'
import UpdateGroupChatModal from './misc/UpdateGroupChatModal'
import axios from 'axios'
import "./styles.css"
import ScrollableChat from './ScrollableChat'
import io from 'socket.io-client'
import Lottie from 'react-lottie'
import animationData from '../animations/typing.json'

const ENDPOINT = import.meta.env.VITE_BACKEND_URL ;
var socket , selectedChatCompare ;


const SingleChat = ({fetchAgain , setFetchAgain}) => {

  const [messages , setMessages] = useState([]) ;
  const [loading , setLoading] = useState(false) ;
  const [newMessage , setNewMessage] = useState('') ;
  const [socketConnected , setSocketConnected] = useState(false) ;
  const [typing , setTyping] = useState(false) ;
  const [isTyping , setIsTyping] = useState(false) ;

  const defaultOptions = {
    loop: true ,
    autoplay: true ,
    animationData : animationData ,
    rendererSettings : {
      preserveAspectRatio : 'xMidYMid slice'
    }
  }

  const {user , selectedChat , setSelectedChat , notification , setNotification} = ChatState() ;
  const toast = useToast() ;

  const fetchMessages = async() => {
    if(!selectedChat){
      return ;
    }

    try {
      const config = {
        headers : {
          Authorization : `Bearer ${user.token}`
        }
      } 
      setLoading(true) ;
      const {data} = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/message/${selectedChat._id}` , config) ;

      setMessages(data) ;
      setLoading(false) ;
      socket.emit('join chat' , selectedChat._id) ;

    } 
    catch (error) {
      toast({
        title : "Error Occured!",
        description : "Failed to Load the messages",
        status : "error",
        duration : 5000,
        isClosable : true,
        position : "bottom"
      })
    }
  }

  useEffect(()=>{
    socket = io(ENDPOINT, {
      auth: { token: user.token }
    });
    socket.emit('setup' , user) ;
    socket.on('connected' , ()=>{
      setSocketConnected(true) ;
    })
    
    socket.on('typing' , ()=>{
      setIsTyping(true) ;
    })

    socket.on('stop typing' , ()=>{
      setIsTyping(false) ;
    })

  } ,[])

  useEffect(()=>{
    fetchMessages() ;
    selectedChatCompare = selectedChat ;
  } , [selectedChat]);

  useEffect(()=>{
    socket.on('message recieved', (newMessageRecieved)=>{
      if(!selectedChatCompare || selectedChatCompare._id !== newMessageRecieved.chat._id){
        if(!notification.includes(newMessageRecieved)){
          setNotification([newMessageRecieved , ...notification]) ;
          setFetchAgain(!fetchAgain) ;
        }
      }
      else {
        setMessages([...messages , newMessageRecieved]) ;
      }
    })
    
    socket.on('message edited', (editedMessage) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg._id === editedMessage._id ? editedMessage : msg
        )
      );
    });

    return () => {
      socket.off('message recieved');
      socket.off('message edited');
    };
  })

  const sendMessage = async(e) => {
    if(e.key==="Enter" && newMessage){
      socket.emit('stop typing', selectedChat._id) ;
      try {
        const config = {
          headers : {
            "Content-type" : "application/json",
            Authorization : `Bearer ${user.token}`
          }
        } 
        setNewMessage("") ;
        let encryptedContent = newMessage;
        if (!selectedChat.isGroupChat) {
          const recipient = selectedChat.users[0]._id === user._id ? selectedChat.users[1] : selectedChat.users[0];
          const pubRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/${recipient._id}/publicKey`, config);
          const publicKeyJwk = JSON.parse(pubRes.data.publicKey);
          const importedPubKey = await window.crypto.subtle.importKey(
            'jwk',
            publicKeyJwk,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['encrypt']
          );
          const encoder = new TextEncoder();
          const encodedMsg = encoder.encode(newMessage);
          const encrypted = await window.crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            importedPubKey,
            encodedMsg
          );
          encryptedContent = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
        } else {
          const encoder = new TextEncoder();
          const encodedMsg = encoder.encode(newMessage);
          const encryptedArray = [];
          for (const member of selectedChat.users) {
            if (member._id === user._id) continue;
            try {
              const pubRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/user/${member._id}/publicKey`, config);
              const publicKeyJwk = JSON.parse(pubRes.data.publicKey);
              const importedPubKey = await window.crypto.subtle.importKey(
                'jwk',
                publicKeyJwk,
                { name: 'RSA-OAEP', hash: 'SHA-256' },
                true,
                ['encrypt']
              );
              const encrypted = await window.crypto.subtle.encrypt(
                { name: 'RSA-OAEP' },
                importedPubKey,
                encodedMsg
              );
              const encryptedB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
              encryptedArray.push({ userId: member._id, encrypted: encryptedB64 });
            } catch (e) {
              continue;
            }
          }
          encryptedContent = JSON.stringify(encryptedArray);
        }
        const {data} = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/message` , {
          content : encryptedContent , 
          chatId : selectedChat._id 
        } , config) ;

        const localMessage = {
          ...data,
          content: newMessage,
          sender: { _id: user._id, name: user.name, pic: user.pic },
        };
        setMessages([...messages , localMessage]) ;
        try {
          const sentPlaintexts = JSON.parse(localStorage.getItem('sentPlaintexts') || '{}');
          sentPlaintexts[data._id] = newMessage;
          localStorage.setItem('sentPlaintexts', JSON.stringify(sentPlaintexts));
        } catch (e) {}
        socket.emit('new message' , data) ;
      }
       catch (error) {
          toast({
            title : "Error Occured!",
            description : "Failed to send the message",
            status : "error",
            duration : 5000,
            isClosable : true,
            position : "bottom"
          })
      }
    }
  }

  const typingHandler = (e) => {
      setNewMessage(e.target.value) ;
      if(!socketConnected){
        return ;
      }
      if(!typing){
        setTyping(true) ;
        socket.emit('typing' , selectedChat._id) ;
      }

      let lastTypingTime = new Date().getTime() ;
      var timerLength = 3000 ;
      setTimeout(()=>{ 
        var timeNow = new Date().getTime() ;
        var timeDiff = timeNow - lastTypingTime ;

        if(timeDiff >= timerLength && typing){
          socket.emit('stop typing', selectedChat._id) ;
          setTyping(false) ;
        }
      } , timerLength) ;
  }

  return (
    <>
    {selectedChat? (
        <>
        <Text
        fontSize={{base:"28px", md:"30px"}}
        pb={3}
        px={2}
        w='100%'
        fontFamily='Work sans'
        display='flex'
        justifyContent={{base:"space-between"}}
        alignItems='center'>
          <IconButton display={{base:'flex' , md:'none'}}
          icon={<ArrowBackIcon />}
          onClick={()=>setSelectedChat('')}
          />
          {!selectedChat.isGroupChat ? (
              <>
              {getSender(user , selectedChat.users)}
              <ProfileModal user={getSenderFull(user , selectedChat.users)} />
              </>
          ) : (
            <>
            {selectedChat.chatName.toUpperCase()}
            <UpdateGroupChatModal fetchAgain={fetchAgain} setFetchAgain={setFetchAgain}
            fetchMessages={fetchMessages}/>
            </>
          )}
        </Text>
        <Box
        display='flex'
        flexDir='column'
        justifyContent='flex-end'
        p={3}
        bg='#E8E8E8'
        w='100%'
        h='100%'
        borderRadius='lg'
        overflowY='hidden'>
          {loading?(
            <Spinner size='xl' w={20} h={20} alignSelf='center' margin='auto'/>
          ) : (
            <div className='messages'>
              <ScrollableChat messages={messages} setMessages={setMessages} />
            </div>
          )}

          <FormControl onKeyDown={sendMessage} isRequired mt={3}>
            {isTyping ? <div>
              <Lottie
              options={defaultOptions}
              width={70} style={{marginBottom:15 , marginLeft:0}} />
            </div> : (<></>)}
            <Input
            variant='filled'
            bg='#E0E0E0'
            placeholder='Enter a message..'
            onChange={typingHandler}
            value={newMessage}
            />
          </FormControl>
        </Box>
        </>
    ) : <Box display='flex' alignItems='center' justifyContent='center' h='100%'>
        <Text fontSize='3xl' pb={3} fontFamily='Work sans'>
          Click on a user to start chatting
        </Text>
      </Box>}
    </>
  )
}

export default SingleChat

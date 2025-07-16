import React, { useState, useEffect } from 'react'
import ScrollableFeed from 'react-scrollable-feed'
import { isLastMessage, isSameSender, isSameSenderMargin } from '../config/ChatLogics'
import { ChatState } from '../Context/ChatProvider'
import { 
  Avatar, 
  Tooltip, 
  Box, 
  IconButton, 
  Menu, 
  MenuButton, 
  MenuList, 
  MenuItem, 
  Input, 
  HStack, 
  Text,
  useToast,
  Flex
} from '@chakra-ui/react'
import { ChevronDownIcon, EditIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons'
import axios from 'axios'
import io from 'socket.io-client';
const ENDPOINT = import.meta.env.VITE_BACKEND_URL;
let socket = window._globalSocket;

const ScrollableChat = ({messages, setMessages}) => {

  const {user, selectedChat} = ChatState() ;
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const toast = useToast();
  const [decryptedMessages, setDecryptedMessages] = useState([]);

  useEffect(() => {
    const decryptAll = async () => {
      if (!messages || !Array.isArray(messages)) return;
      let privateKeyJwk = localStorage.getItem('privateKey');
      let importedPrivKey = null;
      if (privateKeyJwk) {
        privateKeyJwk = JSON.parse(privateKeyJwk);
        try {
          importedPrivKey = await window.crypto.subtle.importKey(
            'jwk',
            privateKeyJwk,
            { name: 'RSA-OAEP', hash: 'SHA-256' },
            true,
            ['decrypt']
          );
        } catch (e) { importedPrivKey = null; }
      }
      const decoder = new TextDecoder();
      const newMsgs = await Promise.all(messages.map(async (m) => {
        if (selectedChat && !selectedChat.isGroupChat) {
          if (m.sender._id !== user._id && importedPrivKey) {
            try {
              const encryptedBytes = Uint8Array.from(atob(m.content), c => c.charCodeAt(0));
              const decrypted = await window.crypto.subtle.decrypt(
                { name: 'RSA-OAEP' },
                importedPrivKey,
                encryptedBytes
              );
              return { ...m, decryptedContent: decoder.decode(decrypted) };
            } catch (e) {
              return { ...m, decryptedContent: m.content };
            }
          } else {
            return { ...m, decryptedContent: m.content };
          }
        } else if (selectedChat && selectedChat.isGroupChat) {  
          if (m.sender._id === user._id) {
            return { ...m, decryptedContent: m.content };
          }
          let arr = null;
          try {
            arr = JSON.parse(m.content);
          } catch (e) {}
          if (Array.isArray(arr)) {
            const entry = arr.find(e => e.userId === user._id);
            if (entry && importedPrivKey) {
              try {
                const encryptedBytes = Uint8Array.from(atob(entry.encrypted), c => c.charCodeAt(0));
                const decrypted = await window.crypto.subtle.decrypt(
                  { name: 'RSA-OAEP' },
                  importedPrivKey,
                  encryptedBytes
                );
                return { ...m, decryptedContent: decoder.decode(decrypted) };
              } catch (e) {
                return { ...m, decryptedContent: m.content };
              }
            } else {
              return { ...m, decryptedContent: m.content };
            }
          } else {
            return { ...m, decryptedContent: m.content };
          }
        } else {
          return { ...m, decryptedContent: m.content };
        }
      }));
      setDecryptedMessages(newMsgs);
    };
    decryptAll();
  }, [messages, selectedChat, user._id]);

  useEffect(() => {
    if (!window._globalSocket) {
      window._globalSocket = io(ENDPOINT, {
        auth: { token: user.token }
      });
    }
    socket = window._globalSocket;
  }, [user.token]);

  const handleEditClick = (message) => {
    setEditingMessageId(message._id);
    if (message.sender._id === user._id) {
      const sentPlaintexts = JSON.parse(localStorage.getItem('sentPlaintexts') || '{}');
      setEditContent(sentPlaintexts[message._id] || message.content);
    } else {
      setEditContent(message.decryptedContent || message.content);
    }
  };

  const handleEditCancel = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const handleEditSave = async (messageId) => {
    if (!editContent.trim()) {
      toast({
        title: "Error",
        description: "Message cannot be empty",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    try {
      let encryptedContent = editContent;
      if (!selectedChat.isGroupChat) {
        const message = messages.find(m => m._id === messageId);
        const recipient = selectedChat.users[0]._id === user._id ? selectedChat.users[1] : selectedChat.users[0];
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`
          }
        };
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
        const encodedMsg = encoder.encode(editContent);
        const encrypted = await window.crypto.subtle.encrypt(
          { name: 'RSA-OAEP' },
          importedPubKey,
          encodedMsg
        );
        encryptedContent = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
      } else {
        const encoder = new TextEncoder();
        const encodedMsg = encoder.encode(editContent);
        const encryptedArray = [];
        for (const member of selectedChat.users) {
          if (member._id === user._id) continue;
          try {
            const config = {
              headers: {
                "Content-type": "application/json",
                Authorization: `Bearer ${user.token}`
              }
            };
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
          } catch (e) { continue; }
        }
        encryptedContent = JSON.stringify(encryptedArray);
      }
      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`
        }
      };
      const { data } = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/message/edit`,
        {
          messageId: messageId,
          content: encryptedContent
        },
        config
      );
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg._id === messageId ? data : msg
        )
      );
      setEditingMessageId(null);
      setEditContent('');
      try {
        const sentPlaintexts = JSON.parse(localStorage.getItem('sentPlaintexts') || '{}');
        sentPlaintexts[messageId] = editContent;
        localStorage.setItem('sentPlaintexts', JSON.stringify(sentPlaintexts));
      } catch (e) {}
      if (socket && socket.emit) {
        socket.emit('message edited', data);
      }
      toast({
        title: "Success",
        description: "Message updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to edit message",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const shouldShowSenderName = (m, i) => {
    if (!selectedChat?.isGroupChat) return false;
    if (m.sender._id === user._id) return false;
    if (i === 0) return true;
    return messages[i - 1].sender._id !== m.sender._id;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollableFeed>
        {decryptedMessages && decryptedMessages.map((m,i)=>(
            <div style={{display:"flex", flexDirection: "column"}} key={m._id}>
                <div style={{display: "flex"}}>
                {
                   ( isSameSender(messages, m, i, user._id)
                   || isLastMessage(messages, i, user._id) )
                   && (
                    <Tooltip label={m.sender.name} placement='bottom-start' hasArrow>
                        <Avatar 
                        mt='7px'
                        mr={1}
                        size='sm'
                        cursor='pointer'
                        name={m.sender.name}
                        src={m.sender.pic}
                        />
                    </Tooltip>
                   )
                }

                <Box
                    className="message-bubble"
                    backgroundColor={`${m.sender._id === user._id ? '#BEE3F8' : '#B9F5D0'}`}
                    borderRadius='20px'
                    padding='5px 15px'
                    maxWidth='75%'
                    marginLeft={isSameSenderMargin(messages, m, i, user._id)}
                    marginTop={isSameSender(messages, m, i, user._id) ? 3 : 10}
                    position="relative"
                    _hover={{
                      backgroundColor: `${m.sender._id === user._id ? '#A8D8F8' : '#A8F5D0'}`
                    }}
                >
                    {shouldShowSenderName(m, i) && (
                      <Text fontSize="sm" fontWeight="bold" color="#2186eb" mb={1}>
                        {m.sender.name}
                      </Text>
                    )}
                    {editingMessageId === m._id ? (
                      <Box>
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          size="sm"
                          mb={2}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleEditSave(m._id);
                            } else if (e.key === 'Escape') {
                              handleEditCancel();
                            }
                          }}
                        />
                        <HStack spacing={2}>
                          <IconButton
                            size="xs"
                            colorScheme="green"
                            icon={<CheckIcon />}
                            onClick={() => handleEditSave(m._id)}
                          />
                          <IconButton
                            size="xs"
                            colorScheme="red"
                            icon={<CloseIcon />}
                            onClick={handleEditCancel}
                          />
                        </HStack>
                      </Box>
                    ) : (
                      <>
                        <Text fontSize="md" color="black">
                          {m.sender._id === user._id
                            ? (JSON.parse(localStorage.getItem('sentPlaintexts') || '{}')[m._id] ||
                                <span style={{ color: '#888', fontStyle: 'italic' }}>(Encrypted message sent)</span>)
                            : m.decryptedContent}
                        </Text>
                        <Flex alignItems="center" justifyContent="flex-end" mt={1}>
                          {m.isEdited && (
                            <Text fontSize="xs" color="gray.500" mr={1} className="edited-indicator">
                              (edited)
                            </Text>
                          )}
                          <Text fontSize="xs" color="gray.500">
                            {formatTime(m.createdAt)}
                          </Text>
                          {m.sender._id === user._id && (
                            <Menu>
                              <MenuButton
                                as={IconButton}
                                icon={<ChevronDownIcon />}
                                variant="ghost"
                                size="xs"
                                ml={2}
                                className="edit-menu"
                                opacity={0}
                              />
                              <MenuList>
                                <MenuItem 
                                  icon={<EditIcon />}
                                  onClick={() => handleEditClick(m)}
                                >
                                  Edit
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          )}
                        </Flex>
                      </>
                    )}
                </Box>
                </div>
            </div>
        ))}
    </ScrollableFeed>
  )
}

export default ScrollableChat
import React, { useState } from 'react'
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

const ScrollableChat = ({messages, setMessages}) => {

  const {user, selectedChat} = ChatState() ;
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const toast = useToast();

  const handleEditClick = (message) => {
    setEditingMessageId(message._id);
    setEditContent(message.content);
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
          content: editContent
        },
        config
      );

      // Update the message in the messages array
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg._id === messageId ? data : msg
        )
      );

      setEditingMessageId(null);
      setEditContent('');

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
    // Show if first message or sender changes
    if (i === 0) return true;
    return messages[i - 1].sender._id !== m.sender._id;
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ScrollableFeed>
        {messages && messages.map((m,i)=>(
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
                          {m.content}
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
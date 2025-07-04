import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  Box,
  Avatar,
  Divider,
  useToast
} from '@chakra-ui/react';
import axios from 'axios';
import { ChatState } from '../../Context/ChatProvider';

const MessageHistoryModal = ({ isOpen, onClose, messageId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = ChatState();
  const toast = useToast();

  useEffect(() => {
    if (isOpen && messageId) {
      fetchMessageHistory();
    }
  }, [isOpen, messageId]);

  const fetchMessageHistory = async () => {
    setLoading(true);
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      };

      const { data } = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/message/history/${messageId}`,
        config
      );

      setHistory(data.editHistory || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load message history",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Message Edit History</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <Text>Loading history...</Text>
          ) : history.length > 0 ? (
            <VStack spacing={4} align="stretch">
              {history.map((entry, index) => (
                <Box key={index} p={3} borderWidth={1} borderRadius="md">
                  <HStack spacing={3} mb={2}>
                    <Avatar
                      size="sm"
                      name={entry.editedBy?.name}
                      src={entry.editedBy?.pic}
                    />
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" fontSize="sm">
                        {entry.editedBy?.name}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {formatDate(entry.editedAt)}
                      </Text>
                    </VStack>
                  </HStack>
                  <Text fontSize="sm" bg="gray.50" p={2} borderRadius="md">
                    {entry.content}
                  </Text>
                </Box>
              ))}
            </VStack>
          ) : (
            <Text>No edit history available</Text>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default MessageHistoryModal; 
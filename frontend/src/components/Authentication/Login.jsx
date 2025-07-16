import { Button, FormControl, FormLabel, Input,  VStack, useToast} from '@chakra-ui/react'
import React, { useState } from 'react'
import axios from 'axios'
import {useHistory} from 'react-router-dom'

const Login = () => {

    const [email , setEmail] = useState("") ;
    const [password , setPassword] = useState("") ;
    const  [loading , setLoading] = useState(false) ;
    const toast = useToast() ;
    const history = useHistory() ;
    const submitHandler = async () =>{
      setLoading(true) ;
      if(!email || !password){
        toast({
          title : "Please Fill all the Fields" ,
          status : "warning" ,
          duration : 5000 ,
          isClosable : true ,
          position : 'bottom'
        })
        setLoading(false) ;
        return ;
      }

      try {
        const config = {
          headers : {
            "Content-Type" : "application/json"
          }
        } ;
        const res= await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/login` , {
          email , password
        } , {config}) ;

        toast({
          title : "Login Successful" , 
          status : "success" , 
          duration : 5000 ,
          isClosable : true ,
          position : "bottom"
        })

        localStorage.setItem("userInfo" , JSON.stringify(res.data)) ;
        // --- Begin RSA Key Generation and Upload ---
        const generateAndStoreKeys = async () => {
          // Always generate a new keypair on login
          const keyPair = await window.crypto.subtle.generateKey({
            name: "RSA-OAEP",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
          }, true, ["encrypt", "decrypt"]);

          // Export and store private key (JWK)
          const privateJwk = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);
          localStorage.setItem('privateKey', JSON.stringify(privateJwk));

          // Export and send public key (JWK)
          const publicJwk = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
          await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/publicKey`, {
            userId: res.data._id,
            publicKey: publicJwk
          }, {
            headers: { Authorization: `Bearer ${res.data.token}` }
          });
        };
        await generateAndStoreKeys();
        // --- End RSA Key Generation and Upload ---
        setLoading(false) ;
        window.location.reload() ;
        history.push('/chats') ;
      }
      catch(e){
        toast({
          title : "Error Occurred!" , 
          description : e.response.data.message ,
          status : "error" , 
          duration : 5000 ,
          isClosable : true ,
          position : "bottom"
        })
        setLoading(false) ;
      }
    }
  
    return (
      <VStack spacing='5px' color={'black'}>  
          <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input
              placeholder='Enter your email'
              value={email}
              onChange={(e)=> setEmail(e.target.value)} />
          </FormControl>
  
          <FormControl id="password" isRequired>
              <FormLabel>Password</FormLabel>
              <Input
              type='password'
              placeholder='Enter your password'
              value={password}
              onChange={(e)=> setPassword(e.target.value)} />
          </FormControl>

          <Button colorScheme='blue' width='100%'
          style={{marginTop : 15}}
          onClick={submitHandler}
          isLoading = {loading}>Login</Button>

          <Button variant='solid' colorScheme='red' width='100%'
          style={{marginTop : 15}}
          onClick={() => {
            localStorage.removeItem('userInfo');
            localStorage.removeItem('privateKey');
            setEmail('guest@example.com');
            setPassword('123456');
          }}
        >Get Guest User Credentials</Button>
      </VStack>
    )
  }
  

export default Login
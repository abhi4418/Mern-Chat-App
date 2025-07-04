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
            setEmail('guest@example.com') ;
            setPassword('123456')
            }
          }>Get Guest User Credentials</Button>
      </VStack>
    )
  }
  

export default Login
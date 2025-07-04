import { Button, FormControl, FormLabel, Input, VStack, useToast } from '@chakra-ui/react'
import React, { useState } from 'react'
import axios from 'axios'
import {useHistory} from 'react-router-dom'

const Signup = () => {
  
  const [name , setName] = useState("") ;
  const [email , setEmail] = useState("") ;
  const [password , setPassword] = useState("") ;
  const [confirmpassword , setConfirmPassword] = useState("") ;
  const [pic , setPic] = useState() ;
  const [loading , setLoading] = useState(false) ;
  const toast = useToast() ;
  const history = useHistory() ;

  const postDetails = (pics) =>{
    setLoading(true) ;
    if(pics===undefined){
        toast({
            title:"Please Select an Image!" ,
            status : "warning" ,
            duration : 5000 ,
            isClosable : true ,
            position : "bottom"
        });
        return ;
    }

    if (pics.type === "image/jpeg" || pics.type === "image/png") {

        const data = new FormData()
        data.append("file", pics)
        data.append("upload_preset", "chat-app")
        data.append("cloud_name","dfxn46e67")
        axios.post("https://api.cloudinary.com/v1_1/dfxn46e67/image/upload", data)
          .then((response) => {
            console.log("Cloudinary response:", response);
            setPic(response.data.url.toString());
            setLoading(false);
            toast({
              title: "Image uploaded successfully!",
              status: "success",
              duration: 5000,
              isClosable: true,
              position: "bottom",
            });
          })
          .catch((error) => {
            console.log("Cloudinary error:", error);
            setLoading(false);
          });
      }
      else {
        toast({
          title:"Please Select an Image!" ,
          status : "warning" ,
          duration : 5000 ,
          isClosable : true ,
          position : "bottom"
      });
      return ;
      }
  }

  const submitHandler = async () =>{
    setLoading(true) ;
    if(!name || !email || !password || !confirmpassword ){
      toast({
        title : "Please Fill All the Fields" ,
        status : "warning" ,
        duration : 5000 , 
        isClosable : true ,
        position : 'bottom'
      })
      setLoading(false) ;
      return ;
    }

    if(password !== confirmpassword){
      toast({
        title : "Passwords Do Not Match" ,
        status : "warning" ,
        duration : 5000 , 
        isClosable : true ,
        position : 'bottom'
      })
      return ;
    }

    try{
      const config = {
        headers : {
          "Content-Type" : "application-json"
        }
      }

      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user` , {name , email , password , pic} ,{
        config
      }) ;

      toast({
        title : "Registration is Successful" ,
        status : "success" ,
        duration : 5000 , 
        isClosable : true ,
        position : 'bottom'
      })

      localStorage.setItem('user-info' , JSON.stringify(res.data)) ;
      setLoading(false) ;
      history.push('/chats') ;
    }
    catch(e){
      toast({
        title : "Error Ocurred!" ,
        status : "error" ,
        description : e.response.data.message,
        duration : 5000 , 
        isClosable : true ,
        position : 'bottom'
      })
      setLoading(false) ;
    }
 
  }

  return (
    <VStack spacing='5px' color={'black'}>
        <FormControl id="first-name" isRequired>
            <FormLabel>Name</FormLabel>
            <Input
            placeholder='Enter your name'
            value={name}
            onChange={(e)=> setName(e.target.value)} />
        </FormControl>

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

        <FormControl id="confirm-password" isRequired>
            <FormLabel>Confirm Password</FormLabel>
            <Input
            type='password'
            placeholder='Confirm your password'
            value={confirmpassword}
            onChange={(e)=> setConfirmPassword(e.target.value)} />
        </FormControl>

        <FormControl id="pic" >
            <FormLabel>Upload your picture</FormLabel>
            <Input
            type='file'
            p={1.5}
            accept='image/*'
            onChange={(e)=> postDetails(e.target.files[0])} />
        </FormControl>

        <Button colorScheme='blue' width='100%'
        style={{marginTop : 15}}
        onClick={submitHandler}
        isLoading={loading}>Sign up</Button>
    </VStack>
  )
}

export default Signup;

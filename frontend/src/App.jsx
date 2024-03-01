import './App.css'
import { Route } from 'react-router-dom/cjs/react-router-dom.min'
import ChatPage from './pages/ChatPage'
import HomePage from './pages/HomePage'

function App() {

  return (
    <div className='App'>
      <Route path='/' component = {HomePage} exact />
      <Route path='/chats' component={ChatPage} />
    </div>
  )
}

export default App

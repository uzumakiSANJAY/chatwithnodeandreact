import './App.css';
// import { Button } from '@chakra-ui/react';
import { Route } from 'react-router-dom';
import Homepage from './Pages/Homepage';
import ChatPage from './Pages/ChatPage';
function App() {
  return (
    <div className="App">
      <Route path = '/' exact component={Homepage}/>
      <Route path = '/chats' exact component={ChatPage}/>
    </div>
  );
}

export default App;

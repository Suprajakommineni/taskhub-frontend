import {BrowserRouter, Routes, Route, Navigate} from "react-router-dom";
import Register from "./pages/Register"; 
import Login from "./pages/Login"; 
import Dashboard from "./pages/Dashboard"; 
import { AppDataProvider } from "./context/Appdatacontext";
import Projects from "./pages/Projects";
import ProjectTasks from "./pages/ProjectTasks";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import ProtectedRoute from "./Components/ProtectedRoute";
import {SearchProvider} from "./Components/Search";
import { SearchResetter } from "./Components/Search";

function App ()  {
  return(

    <BrowserRouter>
    <AppDataProvider>
    <SearchProvider>
      <SearchResetter />
      <Routes>
        <Route path = "/" element={<Navigate to = "/register" />} />
      <Route path = "/register" element = {<Register/>} />
      <Route path = "/login" element = {<Login/>} />
      <Route path = "/dashboard" element = {
        <ProtectedRoute><Dashboard/></ProtectedRoute>} />
      
      <Route path = "/projects" element = {<ProtectedRoute><Projects/></ProtectedRoute>} />
       <Route path="/projects/:projectId/tasks" element={<ProtectedRoute><ProjectTasks/></ProtectedRoute>} />
       <Route path = "/settings" element = {<Settings/>} />
       <Route path = "/analytics" element = {<Analytics/>} />
       
    </Routes>
    </SearchProvider>
    </AppDataProvider>
    </BrowserRouter>
  )

}
export default App
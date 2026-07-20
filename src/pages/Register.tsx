import { Link, useNavigate} from "react-router-dom";
import { Mail, Lock, User } from "lucide-react";
import API from "../api/authapi"
import {useState} from "react"

function Register() {

  const[username, setUsername] = useState("");
  const[email,setEmail] =useState("");
  const[password,setPassword] = useState ("");
  const navigate = useNavigate();

  
  const handleSubmit = async (e: React.SubmitEvent) => {
  e.preventDefault();

  try {
    await API.post("/api/auth/register", {
      username,
      email,
      password,
    });


    console.log("Registered successfully");
    
    navigate("/login")
  } catch (e: any) {
  console.log(e.response?.data);
}
};

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center">
      <div className="w-full max-w-6xl min-h-[680px] bg-white rounded-[28px] shadow-2xl overflow-hidden grid lg:grid-cols-2">
        
        <div className="hidden lg:flex bg-[#0b46bc] text-white p-12 flex-col justify-between relative overflow-hidden">
          <div>
            <h1 className="text-3xl font-bold">TaskHub</h1>
          </div>

          <div className="relative z-10">
            <h2 className="text-5xl font-bold leading-tight mb-5">
              Manage your work with confidence.
            </h2>
            <p className="text-blue-100 text-lg max-w-md">
              Track projects, tasks, team collaboration, and analytics from one modern dashboard.
            </p>
          </div>

          <div className="absolute -right-24 -bottom-24 w-80 h-80 bg-blue-400/30 rounded-full" />
          <div className="absolute right-20 top-28 w-36 h-36 bg-white/10 rounded-full" />
        </div>

        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              Create Account
            </h2>
            <p className="text-slate-500 mb-10">
              Register first to start using TaskHub.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Username
                </label>
                <div className="flex items-center gap-3 border border-slate-200 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-500">
                  <User className="w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    className="w-full outline-none text-slate-800"
                    required value={username} onChange = {(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-3 border border-slate-200 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-500">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    className="w-full outline-none text-slate-800"
                    required value = {email} onChange = {(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Password
                </label>
                <div className="flex items-center gap-3 border border-slate-200 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-500">
                  <Lock className="w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    className="w-full outline-none text-slate-800"
                    required value = {password} onChange = {(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

            <button type = "submit"  className="block w-full text-center bg-[#0b46bc] text-white py-4 rounded-2xl font-bold hover:bg-[#0334ac] transition cursor-pointer">Register</button>
            </form>

            <p className="text-center text-slate-500 mt-8">
              Already have an account?{" "}
              <Link to="/login" className="text-[#0b46bc] font-bold">
                Login
              </Link>
            </p>
          </div> 
        </div>

     </div> 
    </div>
  );
}

export default Register;
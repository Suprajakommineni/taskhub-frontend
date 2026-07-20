import { Link ,useNavigate} from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import {useState} from "react";
import API from "../api/authapi";

function Login() {
  const[email,setEmail] = useState("");
  const[password,setPassword] = useState("");
  const navigate = useNavigate()

  const handleSubmit = async (e:React.SubmitEvent) => {
    e.preventDefault()
    try{
      const response = await API.post("/api/auth/login",{
        email,
        password
      });
      localStorage.setItem("token",response.data.token)
      navigate("/dashboard")
    }
   catch(e){
    console.error("Error",e)
   }
  }



  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4">
      <div className="w-full max-w-6xl min-h-[680px] bg-white rounded-[28px] shadow-2xl overflow-hidden grid lg:grid-cols-2">
        
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto">
            <h2 className="text-4xl font-bold text-slate-900 mb-3">
              Welcome Back
            </h2>
            <p className="text-slate-500 mb-10">
              Login to continue to your TaskHub dashboard.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Email
                </label>
                <div className="flex items-center gap-3 border border-slate-200 rounded-2xl px-4 py-4 focus-within:ring-2 focus-within:ring-blue-500">
                  <Mail className="w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    className="w-full outline-none text-slate-800"
                    required value={email} onChange = {e => setEmail(e.target.value)} 
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
                    required value={password} onChange = {e => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button type = "submit"  className="block w-full text-center bg-[#0b46bc] text-white py-4 rounded-2xl font-bold hover:bg-[#0334ac] transition cursor-pointer">
                Login
              </button>
            </form>

            <p className="text-center text-slate-500 mt-8">
              Don't have an account?{" "}
              <Link to="/register" className="text-[#0b46bc] font-bold">
                Register
              </Link>
            </p>
          </div>
        </div>

        <div className="hidden lg:flex bg-[#0b46bc] text-white p-12 flex-col justify-between relative overflow-hidden">
          <h1 className="text-3xl font-bold">TaskHub</h1>

          <div className="relative z-10">
            <h2 className="text-5xl font-bold leading-tight mb-5">
              Your projects are waiting.
            </h2>
            <p className="text-blue-100 text-lg max-w-md">
              View analytics, monitor team progress, and manage project status in real time.
            </p>
          </div>

          <div className="absolute -left-24 -bottom-24 w-80 h-80 bg-blue-400/30 rounded-full" />
          <div className="absolute left-20 top-28 w-36 h-36 bg-white/10 rounded-full" />
        </div>

      </div>
    </div>
  );
}

export default Login;
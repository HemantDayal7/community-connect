import { Link } from "react-router-dom";

const Profile = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-2xl font-bold">User Profile</h1>
      <p>Manage your Community Connect profile</p>
      <Link to="/dashboard" className="text-blue-500">Back to Dashboard</Link>
    </div>
  );
};

export default Profile;

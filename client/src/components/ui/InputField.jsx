const InputField = ({ label, type = "text", value, onChange, placeholder }) => {
    return (
      <div className="flex flex-col space-y-2">
        {label && <label className="text-gray-700">{label}</label>}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };
  
  export default InputField;
  
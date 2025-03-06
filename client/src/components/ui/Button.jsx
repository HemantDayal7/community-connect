const Button = ({ text, onClick, className = "" }) => {
    return (
      <button
        className={`px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 ${className}`}
        onClick={onClick}
      >
        {text}
      </button>
    );
  };
  
  export default Button;
  
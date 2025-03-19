import PropTypes from 'prop-types';

const Spinner = ({ size = "md" }) => {
  const sizeStyles = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  };
  
  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizeStyles[size] || sizeStyles.md} border-4 border-blue-500 border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
};

Spinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl'])
};

export default Spinner;
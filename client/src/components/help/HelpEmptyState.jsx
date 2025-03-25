import { HandRaisedIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const HelpEmptyState = ({ onRequestHelp }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-8 rounded-lg text-center border border-blue-100 dark:border-blue-800">
      <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-800 rounded-full mb-4">
        <HandRaisedIcon className="h-7 w-7 text-blue-600 dark:text-blue-400" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Need assistance with something?</h3>
      <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto mb-6">
        Our community is here to help. Create a request and connect with members who can assist you with various tasks.
      </p>
      <button
        onClick={onRequestHelp}
        className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-5 py-2 rounded-md font-medium shadow-sm transition-colors"
      >
        Request Help
      </button>
    </div>
  );
};

HelpEmptyState.propTypes = {
  onRequestHelp: PropTypes.func.isRequired
};

export default HelpEmptyState;
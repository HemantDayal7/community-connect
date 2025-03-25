import { ArrowPathIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";

export default function ChatBoxHeader({ recipient, resourceContext, onRefresh, isLoading }) {
  return (
    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
      <div>
        <div className="font-semibold text-gray-900 dark:text-white flex items-center">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-2 text-gray-600 dark:text-gray-300 text-sm font-medium">
            {recipient?.name?.charAt(0).toUpperCase() || "?"}
          </div>
          <span>{recipient?.name || "Unknown User"}</span>
        </div>
        
        {resourceContext && (
          <div className="text-sm text-[#69C143] dark:text-[#83d161] flex items-center mt-1">
            <span>Re: {resourceContext.title}</span>
          </div>
        )}
        
        <button 
          onClick={onRefresh}
          className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mt-1"
          disabled={isLoading}
        >
          <span className="flex items-center">
            <ArrowPathIcon className={`h-3 w-3 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? 'Refreshing...' : 'Refresh messages'}
          </span>
        </button>
      </div>
    </div>
  );
}

ChatBoxHeader.propTypes = {
  recipient: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string
  }),
  resourceContext: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string
  }),
  onRefresh: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};
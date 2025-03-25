import { XCircleIcon, MapPinIcon, ClockIcon, ChatBubbleLeftRightIcon, PencilIcon, TrashIcon, CheckCircleIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const URGENCY_LEVELS = {
  low: { label: "Low", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  high: { label: "High", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" }
};

const HelpRequestDetailsModal = ({
  request,
  onClose,
  onEdit,
  onDelete,
  onMessage,
  onComplete,
  onOfferHelp,
  actionLoading,
  userData
}) => {
  const isRequester = userData && request.requesterId?._id === userData?._id;
  const isHelper = userData && request.helperId?._id === userData?._id;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{request.title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex items-center mb-4">
            <div className={`px-2 py-1 rounded-full text-xs ${URGENCY_LEVELS[request.urgency]?.color}`}>
              {URGENCY_LEVELS[request.urgency]?.label || "Medium"} Priority
            </div>
            <span className="mx-2 text-gray-400 dark:text-gray-500">|</span>
            <span className={`
              px-2 py-1 rounded-full text-xs
              ${request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : ''}
              ${request.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : ''}
              ${request.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : ''}
              ${request.status === 'canceled' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' : ''}
            `}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Description</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{request.description}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300">Category</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">{request.category}</p>
            </div>
            
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <MapPinIcon className="h-4 w-4 mr-2" />
              {request.location}
            </div>
            
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <ClockIcon className="h-4 w-4 mr-2" />
              Posted on {new Date(request.createdAt).toLocaleString()}
            </div>
            
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Requested by</h3>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center mr-2">
                  {request.requesterId?.name?.[0] || "?"}
                </div>
                <span className="font-medium text-gray-800 dark:text-gray-200">{request.requesterId?.name || "Unknown"}</span>
              </div>
            </div>
            
            {request.helperId && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-medium mb-2 text-gray-700 dark:text-gray-300">Helper</h3>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center mr-2">
                    {request.helperId?.name?.[0] || "?"}
                  </div>
                  <span className="font-medium text-gray-800 dark:text-gray-200">{request.helperId?.name || "Unknown"}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <button
              onClick={onClose}
              className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded mr-2"
            >
              Close
            </button>
            
            <div className="flex space-x-2">
              {/* Requester actions */}
              {isRequester && request.status === 'pending' && (
                <>
                  <button
                    onClick={() => onEdit(request)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => onDelete(request._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </>
              )}
              
              {isRequester && request.status === 'in-progress' && (
                <button
                  onClick={() => onComplete(request._id)}
                  disabled={actionLoading}
                  className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded flex items-center"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Mark Complete
                </button>
              )}
              
              {/* Community member actions */}
              {!isRequester && !isHelper && request.status === 'pending' && (
                <button
                  onClick={() => onOfferHelp(request._id)}
                  disabled={actionLoading}
                  className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded flex items-center"
                >
                  <HandRaisedIcon className="h-4 w-4 mr-1" />
                  Offer Help
                </button>
              )}
              
              {/* Message buttons */}
              {isHelper && (
                <button
                  onClick={() => onMessage(request.requesterId._id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Message Requester
                </button>
              )}
              
              {isRequester && request.helperId && (
                <button
                  onClick={() => onMessage(request.helperId._id)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Message Helper
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

HelpRequestDetailsModal.propTypes = {
  request: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onOfferHelp: PropTypes.func.isRequired,
  actionLoading: PropTypes.bool.isRequired,
  userData: PropTypes.object
};

export default HelpRequestDetailsModal;
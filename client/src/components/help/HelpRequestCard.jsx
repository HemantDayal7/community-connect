import { useState } from 'react';
import { 
  MapPinIcon, ClockIcon, ChatBubbleLeftRightIcon, 
  CheckCircleIcon, PencilIcon, TrashIcon, EyeIcon,
  HandRaisedIcon 
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const URGENCY_LEVELS = {
  low: { label: "Low", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  high: { label: "High", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" }
};

const HelpRequestCard = ({ 
  request, 
  userData, 
  onViewDetails, 
  onEdit, 
  onDelete, 
  onMessage, 
  onComplete, 
  onOfferHelp, 
  actionLoading 
}) => {
  const [setHoverState] = useState(false);
  
  // Check user relationships
  const isRequester = userData && request.requesterId?._id === userData?._id;
  const isHelper = userData && request.helperId?._id === userData?._id;
  
  // Status indicator colors
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-400 dark:bg-yellow-500';
      case 'in-progress': return 'bg-blue-500 dark:bg-blue-600';
      case 'completed': return 'bg-green-500 dark:bg-green-600';
      default: return 'bg-gray-300 dark:bg-gray-600';
    }
  };
  
  return (
    <div 
      className="border dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col"
      onMouseEnter={() => setHoverState(true)}
      onMouseLeave={() => setHoverState(false)}
      onClick={() => onViewDetails(request)}
    >
      {/* Status indicator bar */}
      <div className={`h-2 w-full ${getStatusColor(request.status)}`}></div>
      
      <div className="p-4 flex flex-col h-full">
        {/* Header with title and urgency */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{request.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${URGENCY_LEVELS[request.urgency]?.color || "bg-gray-100 dark:bg-gray-700"}`}>
            {URGENCY_LEVELS[request.urgency]?.label || "Medium"} Priority
          </span>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
          {request.description}
        </p>
        
        {/* Details */}
        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2" />
            {request.location}
          </div>
          <div className="flex items-center">
            <ClockIcon className="h-4 w-4 mr-2" />
            Posted {new Date(request.createdAt).toLocaleDateString()}
          </div>
          {!isRequester && (
            <div className="flex items-center">
              <span className="font-medium mr-1">By:</span>
              {request.requesterId?.name || "Unknown"}
            </div>
          )}
        </div>
        
        {/* Status badge */}
        <div className="mt-auto">
          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' : 
            request.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 
            request.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 
            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
          }`}>
            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
          </span>
        </div>
        
        {/* Action buttons */}
        <div className="flex space-x-2 pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(request);
            }}
            className="flex-1 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            Details
          </button>
          
          {isRequester ? (
            <div className="flex space-x-2 flex-1">
              {request.status === 'pending' && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(request);
                    }}
                    className="flex-1 text-white bg-blue-500 hover:bg-blue-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(request._id);
                    }}
                    className="flex-1 text-white bg-red-500 hover:bg-red-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete
                  </button>
                </>
              )}
              {request.status === 'in-progress' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onComplete(request._id);
                  }}
                  disabled={actionLoading}
                  className="flex-1 text-white bg-[#69C143] hover:bg-[#5aad3a] py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  {actionLoading ? "Processing..." : "Mark Complete"}
                </button>
              )}
              {request.helperId && request.status !== 'completed' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage(request.helperId._id);
                  }}
                  className="flex-1 text-white bg-blue-500 hover:bg-blue-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Message Helper
                </button>
              )}
            </div>
          ) : (
            <div className="flex space-x-2 flex-1">
              {isHelper ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessage(request.requesterId._id);
                  }}
                  className="flex-1 text-white bg-blue-500 hover:bg-blue-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Message Requester
                </button>
              ) : (
                request.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOfferHelp(request._id);
                    }}
                    disabled={actionLoading}
                    className="flex-1 text-white bg-[#69C143] hover:bg-[#5aad3a] py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                  >
                    <HandRaisedIcon className="h-4 w-4 mr-1" />
                    {actionLoading ? "Processing..." : "Offer Help"}
                  </button>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

HelpRequestCard.propTypes = {
  request: PropTypes.object.isRequired,
  userData: PropTypes.object,
  onViewDetails: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onOfferHelp: PropTypes.func.isRequired,
  actionLoading: PropTypes.bool
};

export default HelpRequestCard;
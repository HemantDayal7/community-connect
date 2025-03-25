import { useState } from 'react';
import { 
  CalendarIcon, MapPinIcon, UserGroupIcon, 
  ChatBubbleLeftRightIcon, CheckCircleIcon, PencilIcon, TrashIcon, EyeIcon
} from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const EventCard = ({ event, userData, onRSVP, onCancelRSVP, onEdit, onDelete, onViewDetails, onOpenChat }) => {
  const [actionLoading, setActionLoading] = useState(false);
  
  // Check if user is the host
  const isHost = userData && event.hostId?._id === userData._id;
  
  // Check if user is attending
  const isAttending = userData && event.attendees?.some(
    attendee => (typeof attendee === 'object' ? attendee._id : attendee) === userData._id
  );

  // Format date
  const eventDate = new Date(event.date);
  const isPastEvent = eventDate < new Date();
  
  // Handle RSVP with loading state
  const handleRSVP = async (e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await onRSVP(event._id);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle Cancel RSVP with loading state  
  const handleCancelRSVP = async (e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      await onCancelRSVP(event._id);
    } finally {
      setActionLoading(false);
    }
  };
  
  return (
    <div 
      className="border rounded-lg overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 h-full flex flex-col"
      onClick={() => onViewDetails(event)}
    >
      <div className="p-4 flex flex-col h-full">
        {/* Event Title with Category Badge */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white">{event.title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            event.category === "Education" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" :
            event.category === "Arts & Culture" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" :
            event.category === "Fitness" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" :
            event.category === "Social" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" :
            "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
          }`}>
            {event.category}
          </span>
        </div>
        
        {/* Description */}
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">{event.description}</p>
        
        {/* Event Details */}
        <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
          <div className="flex items-center">
            <CalendarIcon className="h-4 w-4 mr-2" />
            {eventDate.toLocaleString()}
          </div>
          <div className="flex items-center">
            <MapPinIcon className="h-4 w-4 mr-2" />
            {event.location}
          </div>
          <div className="flex items-center">
            <UserGroupIcon className="h-4 w-4 mr-2" />
            {event.attendees?.length || 0} attending
          </div>
        </div>
        
        {/* Host Info */}
        <div className="flex items-center mt-auto mb-3">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0 flex items-center justify-center">
            {event.hostId?.name?.[0] || "?"}
          </div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
            {isHost ? "You are hosting" : `Hosted by ${event.hostId?.name || "Unknown"}`}
          </span>
        </div>
        
        {/* Action Buttons - Same layout as Resource/Skill cards */}
        <div className="flex space-x-2 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(event);
            }}
            className="flex-1 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
          >
            <EyeIcon className="h-4 w-4 mr-1" />
            View Details
          </button>
          
          {isHost ? (
            <div className="flex space-x-2 flex-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(event);
                }}
                className="flex-1 text-white bg-blue-500 hover:bg-blue-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
              >
                <PencilIcon className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(event._id);
                }}
                className="flex-1 text-white bg-red-500 hover:bg-red-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
            </div>
          ) : (
            <div className="flex space-x-2 flex-1">
              {event.hostId && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenChat(event.hostId._id);
                  }}
                  className="flex-1 text-white bg-blue-500 hover:bg-blue-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                  Message
                </button>
              )}
              
              {!isPastEvent && !isAttending ? (
                <button
                  onClick={handleRSVP}
                  disabled={actionLoading}
                  className="flex-1 text-white bg-[#69C143] hover:bg-[#5aad3a] py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  {actionLoading ? "Processing..." : "RSVP"}
                </button>
              ) : !isPastEvent && isAttending ? (
                <button
                  onClick={handleCancelRSVP}
                  disabled={actionLoading}
                  className="flex-1 text-white bg-gray-500 hover:bg-gray-600 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center"
                >
                  {actionLoading ? "Processing..." : "Cancel RSVP"}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

EventCard.propTypes = {
  event: PropTypes.object.isRequired,
  userData: PropTypes.object,
  onRSVP: PropTypes.func.isRequired,
  onCancelRSVP: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired, 
  onDelete: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onOpenChat: PropTypes.func.isRequired
};

export default EventCard;
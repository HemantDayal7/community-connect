import { XCircleIcon, CalendarIcon, MapPinIcon, UserGroupIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import PropTypes from 'prop-types';

const EventDetailsModal = ({ 
  event, 
  isHost, 
  isAttending, 
  onClose, 
  onEdit, 
  onDelete, 
  onRSVP, 
  onCancelRSVP, 
  onMessage,
  rsvpLoading 
}) => {
  const isPastEvent = new Date(event.date) < new Date();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{event.title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          </div>
          
          <div className="mb-4">
            <span className={`inline-block text-sm px-3 py-1 rounded-full mb-4 ${
              isPastEvent ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
            }`}>
              {isPastEvent ? 'Past Event' : 'Upcoming'}
            </span>
            
            <p className="text-gray-700 mb-4">{event.description}</p>
            
            <div className="flex items-center text-sm text-gray-600 mb-2">
              <CalendarIcon className="h-4 w-4 mr-2" />
              {new Date(event.date).toLocaleString()}
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <MapPinIcon className="h-4 w-4 mr-2" />
              {event.location}
            </div>
            
            <div className="flex items-center text-sm text-gray-600 mb-4">
              <UserGroupIcon className="h-4 w-4 mr-2" />
              {event.attendees?.length || 0} people attending
            </div>
            
            {/* Category */}
            <div className="mb-4">
              <span className="text-sm font-medium">Category: </span>
              <span className="inline-block bg-gray-100 text-xs text-gray-600 rounded px-2 py-1">
                {event.category || "Other"}
              </span>
            </div>
            
            {/* Host */}
            <div className="border-t pt-4 mb-6">
              <h3 className="font-medium mb-2">Hosted by</h3>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                  {event.hostId?.name?.[0] || "?"}
                </div>
                <span className="font-medium">{event.hostId?.name || "Unknown"}</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between border-t pt-4 mt-4">
              <button
                onClick={onClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded mr-2"
              >
                Close
              </button>
              
              <div className="flex space-x-2">
                {/* Host Actions */}
                {isHost && (
                  <>
                    <button
                      onClick={() => onEdit(event)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDelete(event._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center"
                    >
                      Delete
                    </button>
                  </>
                )}
                
                {/* Attendee Actions */}
                {!isHost && (
                  <>
                    <button
                      onClick={() => onMessage(event.hostId._id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
                    >
                      <ChatBubbleLeftRightIcon className="h-4 w-4 mr-1" />
                      Message Host
                    </button>
                    
                    {!isPastEvent && !isAttending ? (
                      <button
                        onClick={() => onRSVP(event._id)}
                        disabled={rsvpLoading}
                        className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-4 py-2 rounded flex items-center"
                      >
                        {rsvpLoading ? "Processing..." : "RSVP"}
                      </button>
                    ) : !isPastEvent && isAttending ? (
                      <button
                        onClick={() => onCancelRSVP(event._id)}
                        disabled={rsvpLoading}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded flex items-center"
                      >
                        {rsvpLoading ? "Processing..." : "Cancel RSVP"}
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

EventDetailsModal.propTypes = {
  event: PropTypes.object.isRequired,
  isHost: PropTypes.bool.isRequired,
  isAttending: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRSVP: PropTypes.func.isRequired,
  onCancelRSVP: PropTypes.func.isRequired,
  onMessage: PropTypes.func.isRequired,
  rsvpLoading: PropTypes.bool.isRequired
};

export default EventDetailsModal;
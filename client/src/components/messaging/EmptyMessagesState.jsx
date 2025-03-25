import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/24/outline";
import PropTypes from "prop-types";

export default function EmptyMessagesState({ onNewChat }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-24 h-24 bg-[#69C143]/10 rounded-full flex items-center justify-center mb-4">
        <ChatBubbleLeftRightIcon className="h-12 w-12 text-[#69C143]" />
      </div>
      <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2">
        Your messages will appear here
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
        Connect with community members, discuss resources, and coordinate skill exchanges
      </p>
      <button
        onClick={onNewChat}
        className="bg-[#69C143] hover:bg-[#5aad3a] text-white px-5 py-2.5 rounded-md font-medium flex items-center transition-colors"
      >
        <PlusIcon className="h-5 w-5 mr-2" />
        Start a Conversation
      </button>
    </div>
  );
}

EmptyMessagesState.propTypes = {
  onNewChat: PropTypes.func.isRequired
};
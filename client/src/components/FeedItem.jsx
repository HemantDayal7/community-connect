import PropTypes from "prop-types";

export default function FeedItem({ data }) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow">
      <div className="font-bold">{data.user}</div>
      <p className="mt-1 text-gray-700 dark:text-gray-200">{data.text}</p>
    </div>
  );
}

FeedItem.propTypes = {
  data: PropTypes.shape({
    user: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
  }).isRequired,
};
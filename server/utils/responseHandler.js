export const successResponse = (res, data, message = "Success") => {
    res.status(200).json({ status: "success", message, data });
  };
  
  export const errorResponse = (res, message = "An error occurred", statusCode = 500) => {
    res.status(statusCode).json({ status: "error", message });
  };
  
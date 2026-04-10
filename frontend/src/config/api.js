const LOCAL_API_URL = "http://localhost:5000";
const PROD_API_URL = process.env.REACT_APP_API_URL || "https://smartcart-diay.onrender.com";

const API_URL =
	typeof window !== "undefined" && window.location.hostname === "localhost"
		? LOCAL_API_URL
		: PROD_API_URL;

export default API_URL;
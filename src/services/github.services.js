import axios from "axios"

const exchangeCodeForToken = async (code) => {
    const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            code: code
        },
        {
            headers: {
                Accept: "application/json"
            }
        }
    )
    return response.data.access_token
}

const getGithubProfile = async (accessToken) => {
    const response = await axios.get(
        "https://api.github.com/user",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    )
    return response.data
}

export { exchangeCodeForToken, getGithubProfile }
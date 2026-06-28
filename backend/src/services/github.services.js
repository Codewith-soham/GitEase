import axios from "axios"

const exchangeCodeForToken = async (code) => {
    console.log('CLIENT_ID:', process.env.CLIENT_ID)
    console.log('SECRET:', process.env.CLIENT_SECRET ? 'exists' : 'missing')
    console.log('CODE:', code)

    const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
            client_id: process.env.CLIENT_ID,
            client_secret: process.env.CLIENT_SECRET,
            code: code
        },
        {
            headers: {
                Accept: "application/json"
            }
        }
    )

    console.log('GITHUB RESPONSE:', response.data)
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

const getGithubRepos = async(accessToken) => {
    const response = await axios.get(
        "https://api.github.com/user/repos",
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    )
    return response.data
}

export { exchangeCodeForToken, getGithubProfile , getGithubRepos}
import axios from 'axios'

const instance = axios.create({
    baseURL:'https://www.cowin.gov.in/api/v2/'
})

export default instance

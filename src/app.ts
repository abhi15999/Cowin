import inquirer from 'inquirer'
import axiosInstance from './axiosInstance'
import moment from 'moment'
import chalk from 'chalk'
import ora from 'ora'

let states:string[] = []

const getStateInput:any = (states:ArrayBuffer) => {
    return new Promise((resolve, reject) => {
        inquirer.prompt([{
            type:'list',
            name:'state',
            message:'Select a State',
            loop:false,
            choices:states
        }]).then((answers)=>{
            resolve(answers.state)
        })
    })
}


const getDistrictInput:any = (districts:any) => {

    return new Promise((resolve,reject)=>{
        inquirer.prompt([{
            type:'list',
            name:'district',
            message:'Select District',
            loop:false,
            choices:Object.keys(districts)
        },{
            type:'list',
            name:'age',
            message:'Select Age',
            loop:false,
            choices:['18-45','45+']
        }
    ])
        .then((answer)=>{
            // console.log(answer)
            resolve({id:districts[answer.district],age:answer.age})
        })
    })
}

const getState =  () => {
    return new Promise(async (resolve,reject)=>{
        const stateData = await axiosInstance.get('/admin/location/states')
        stateData.data.states.forEach((state:any)=>{
            states.push(state.state_name)
        })
        
        getStateInput(states)
        .then((res:any)=>{
            resolve(states.indexOf(res))
        })
    })
}

getState().then((res)=>{
    const id = res
    let districts:any = {}

    new Promise(async (resolve,reject)=>{
        const districtData = await axiosInstance.get(`/admin/location/districts/${id}`)
        districtData.data.districts.forEach((district:any)=>{
            districts[district.district_name] = district.district_id
        }) 
        getDistrictInput(districts)
        .then((res:any)=>{
            const age = res.age
            const districtId= res.id
            const formatDate = moment(new Date).format("DD-MM-YYYY") 
            const spinner = ora('Loading Vaccine Details').start();
            const vaccineData = () => axiosInstance.get(`appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${formatDate}`)
                .then(async (res:any)=>{
                    spinner.stop()
                    for (let i = 0 ; i < res.data.centers.length; i++)
                    {
                        for (let j = 0 ; j < res.data.centers[i].sessions.length ; j++)
                        {
                            if(res.data.centers[i].sessions[j].available_capacity > 0)
                            {
                                if(age === "18-45")
                                {
                                    if( res.data.centers[i].sessions[j].min_age_limit <= 45 )
                                    {           
                                        console.log(chalk.green(res.data.centers[i].name) +" Vaccine Available = "+ chalk.blue(res.data.centers[i].sessions[j].available_capacity))
                                    } 
                                }
                                if(age === "45+")
                                {
                                    if( res.data.centers[i].sessions[j].min_age_limit > 45 )
                                    {  
                                        console.log(chalk.green(res.data.centers[i].name) +"  Vaccine Available = "+ chalk.blue(res.data.centers[i].sessions[j].available_capacity))
                                    }
                                }
                            } else {
                                console.log(chalk.red(res.data.centers[i].name))
                            }
                    }
                }
        })
        vaccineData()
        setInterval(()=>{
            console.clear()
            vaccineData()
        },60000)
    })
})
})
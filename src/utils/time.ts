export function GMT(gmt?: number): Date;
export function GMT(): Date {
    const date = new Date()

    let day = date.getDate().toString()
    let month = (date.getMonth() + 1).toString()
    let year = date.getFullYear().toString()
    let hour = date.getHours().toString()
    let min = date.getMinutes().toString()
    let sec = date.getSeconds().toString()


    if (parseInt(month) < 10) month = `0${month}`
    if (parseInt(day) < 10) day = `0${day}`

    if (parseInt(hour) < 10) hour = `0${hour}`
    if (parseInt(min) < 10) min = `0${min}`
    if (parseInt(sec) < 10) sec = `0${sec}`

    const this_date = new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`)
    return this_date
    // return new Date(Date.now() + 1000 * 60 * 60 * number);
}
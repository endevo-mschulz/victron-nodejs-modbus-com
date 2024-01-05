function vebus_state(number) {
    let result = null;
    switch (number) {
        case 0:
            result = "Off"
            break
        case 1:
            result = "Low Power"
            break
        case 2:
            result = "Fault"
            break
        case 3:
            result = "Bulk"
            break
        case 4:
            result = "Absorption"
            break
        case 5:
            result = "Float"
            break
        case 6:
            result = "Storage"
            break
        case 7:
            result = "Equalize"
            break
        case 8:
            result = "Passthru"
            break
        case 9:
            result = "Inverting"
            break
        case 10:
            result = "Power assist"
            break
        case 11:
            result = "Power supply"
            break
        case 252:
            result = "Bulk protection"
            break
    }
    return result
}

function vebus_state_of_charge(number) {
    return number / 10
}

module.exports = {
    vebus_state: vebus_state,
    vebus_state_of_charge: vebus_state_of_charge,
}
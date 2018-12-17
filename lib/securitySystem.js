let Accessory, PlatformAccessory, Characteristic, Service, UUIDGen;

class SecuritySystem {
    constructor(name, adt, log, hap, platformAccessory) {
        PlatformAccessory = platformAccessory;
        Accessory = hap.Accessory;
        Characteristic = hap.Characteristic;
        Service = hap.Service;
        UUIDGen = hap.uuid;

        this.log = log;
        this.name = name;
        this.adt = adt;

        this.platformAccessory = new PlatformAccessory(name, UUIDGen.generate(name), Accessory.Categories.SECURITY_SYSTEM);

        this.platformAccessory.getService(Service.AccessoryInformation)
            .setCharacteristic(Characteristic.Name, this.name)
            .setCharacteristic(Characteristic.Manufacturer, 'ADT')
            .setCharacteristic(Characteristic.SerialNumber, 'See ADT Smart Security app');

        this.securityService = this.platformAccessory.addService(Service.SecuritySystem, this.name);

        this.securityService
            .getCharacteristic(Characteristic.SecuritySystemCurrentState)
            .on('get', this.getCurrentState.bind(this))
            .setProps({validValues: [0, 1, 3, 4]});

        this.securityService
            .getCharacteristic(Characteristic.SecuritySystemTargetState)
            .on('set', this.setTargetState.bind(this))
            .on('get', this.getTargetState.bind(this))
            .setProps({validValues: [0, 1, 3]});

        this.batteryService = new Service.BatteryService(this.name);

        this.batteryService
            .getCharacteristic(Characteristic.BatteryLevel)
            .on('get', this.getBatteryLevel.bind(this));

        this.batteryService
            .getCharacteristic(Characteristic.StatusLowBattery)
            .on('get', this.getLowBatteryStatus.bind(this));
    }

    getAccessory() {
        return this.platformAccessory;
    }

    getBatteryLevel(callback) {
        this.log('Battery level requested');
        this.adt.getState()
            .then((state) => callback(null, state ? state.alarm.batteryLevel : state))
            .catch((error) => {
                this.log.error(error);
                callback(error);
            });
    }

    getLowBatteryStatus(callback) {
        this.log('Battery status requested');
        this.adt.getState()
            .then((state) => callback(null, state ? state.alarm.lowBatteryStatus : state))
            .catch((error) => {
                this.log.error(error);
                callback(error);
            });
    }

    getCurrentState(callback) {
        this.log('Current state requested');
        this.adt.getState()
            .then((state) => callback(null, state ? state.alarm.armingState : state))
            .catch((error) => {
                this.log.error(error);
                callback(error);
            });
    }

    getTargetState(callback) {
        this.log('Target state requested');
        this.adt.getState()
            .then((state) => callback(null, state ? state.alarm.targetState : state))
            .catch((error) => {
                this.log.error(error);
                callback(error);
            });
    }

    setTargetState(status, callback) {
        this.log('Received target status', status);
        callback(this.adt.setState(status));
    }

    updateCharacteristics(newState) {
        let alarmStatus = newState.alarm;
        this.log.debug('Updating alarm characteristics to', JSON.stringify(alarmStatus));

        this.securityService
            .getCharacteristic(Characteristic.SecuritySystemCurrentState)
            .updateValue(alarmStatus.armingState);
        this.securityService
            .getCharacteristic(Characteristic.SecuritySystemTargetState)
            .updateValue(alarmStatus.targetState);
        this.securityService
            .getCharacteristic(Characteristic.StatusFault)
            .updateValue(alarmStatus.faultStatus);
        this.batteryService
            .getCharacteristic(Characteristic.BatteryLevel)
            .updateValue(alarmStatus.batteryLevel);
        this.batteryService
            .getCharacteristic(Characteristic.StatusLowBattery)
            .updateValue(alarmStatus.lowBatteryStatus);
    }
}

module.exports = {
    SecuritySystem
};
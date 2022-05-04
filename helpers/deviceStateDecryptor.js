function decryptDeviceState(deviceState){
    let data = {};
    Object.keys(deviceState).forEach(key => {
        
        data[key] = deviceState[key];

        // Rename keys and values to human readable
        switch(key){
            case 'ppk_num':
                data['Номер приладу'] = data[key];
                delete data[key];                
                break;
            case 'enabled':
                data[key] === true ? data[key] = 'Так' : data[key] === false ? data[key] = 'Ні' : data[key];
                data['Приписаний'] = data[key];
                delete data[key];                
                break;
            case 'model':
                data['Модель'] = data[key];
                delete data[key];                
                break;
            case 'markedAsOffline':
                data[key] === false ? data[key] = 'Так' : data[key] === true ? data[key] = 'Ні' : data[key];
                data['На зв\'язку'] = data[key];
                delete data[key];                
                break;
            case 'power':
                data[key] === 0 ? data[key] = 'Відключено' : data[key] === 1 ? data[key] = 'Підключено' : data[key];
                data['Мережа 220В'] = data[key];
                delete data[key];                
                break;
            case 'accum':
                data[key] === 0 ? data[key] = 'Розряджено' : data[key] === 1 ? data[key] = 'В нормі' : data[key];
                data['Акумулятор'] = data[key];
                delete data[key];                
                break;
            case 'door':
                data[key] === 0 ? data[key] = 'Відкрито' : data[key] === 1 ? data[key] = 'Закрито' : data[key];
                data['Дверці приладу'] = data[key];
                delete data[key];                
                break;
            case 'lines':               
                for(const prop in data[key]){
                    if(data[key][prop] === 88) data[key][prop] = 'Норма';
                    if(data[key][prop] === 80) data[key][prop] = 'Обрив';
                    if(data[key][prop] === 112) data[key][prop] = 'Коротке замикання';
                    if(data[key][prop] === 120) data[key][prop] = 'Несправний';
                };
                data['Шлейфи'] = data[key];
                delete data[key];                
                break;
            case 'groups':
                for(const prop in data[key]){
                    if(data[key][prop] === 0) data[key][prop] = 'Знята';                 
                    if(data[key][prop] === 1) data[key][prop] = 'Взята';
                    if(data[key][prop] === 2) data[key][prop] = 'Взята частково';                 
                };
                data['Групи'] = data[key];
                delete data[key];                
                break; 
            case 'adapters':
            case 'wsensors':
                for(const prop in data[key]){                  

                    if(data[key][prop].conn === 0) data[key][prop].conn = 'Немає';
                    if(data[key][prop].conn === 1) data[key][prop].conn = 'Є';

                    if(data[key][prop].door === 0) data[key][prop].door = 'Відкрита';
                    if(data[key][prop].door === 1) data[key][prop].door = 'Закрита';

                    if(data[key][prop].power === 0) data[key][prop].power = 'Аварія';
                    if(data[key][prop].power === 1) data[key][prop].power = 'В нормі';
                    
                    for(const k in data[key][prop]){                       
                        if(k === 'conn'){
                            data[key][prop]['Зв\'язок'] = data[key][prop][k];
                            delete data[key][prop][k];
                        };
                        if( k === 'door'){
                            data[key][prop]['Дверця'] = data[key][prop][k];
                            delete data[key][prop][k];
                        };
                        if( k === 'power'){
                            data[key][prop]['Живлення'] = data[key][prop][k];
                            delete data[key][prop][k];
                        };                        
                    };               
                };
                if(key === 'adapters'){
                    data['Адаптери'] = data[key];
                };
                if(key === 'wsensors'){
                    data['Безпровідні дат.'] = data[key];
                };
                delete data[key];           
                break; 
            case 'firmware':
                for(const prop in data[key]){
                    if(prop === 'version'){
                        data[key]['Версія'] = data[key][prop];
                        delete data[key][prop];
                    };
                    if(prop === 'status'){
                        data[key]['Статус'] = data[key][prop];
                        delete data[key][prop];
                    };
                };
                data['Прошивка'] = data[key];
                delete data[key];                
                break;
            case 'outs':
                for(const prop in data[key]){
                    if(data[key][prop] === 0) data[key][prop] = 'Виключено';
                    if(data[key][prop] === 1) data[key][prop] = 'Включено';                    
                };
                data['Виходи'] = data[key];
                delete data[key];                
                break;          
            default:  // delete unknown and unnecessary keys (such as _id, lastActivity)
                delete data[key];             
        };
    
        if (typeof deviceState[key] === 'object' && deviceState[key] !== null) {
            decryptDeviceState(deviceState[key]);
        };
    });
    return data;
};

module.exports = {
    decryptDeviceState
};
const os = require('os');
const { exec } = require('child_process');
const { contextBridge, ipcRenderer } = require('electron');
const Toastify = require('toastify-js');

contextBridge.exposeInMainWorld('os', {
  homedir: () => os.homedir(),
});

contextBridge.exposeInMainWorld('address',{
   getLocalNetworks: ()=>{
    return new Promise((resolve, reject) => {
      exec('arp -a', (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        if (stderr) {
          reject(new Error(stderr));
          return;
        }
  
        const devices = [];
        const lines = stdout.split('\n');
        lines.forEach(line => {
          console.log(line);
          const match = line.match(/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)(?!.*\bstatic\b)/);
          if (match) {
            devices.push(match[0]);
          }
        });
        resolve(devices);
      });
    });  
   }
})

contextBridge.exposeInMainWorld('ipcRenderer', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, func) =>
    ipcRenderer.on(channel, (event, ...args) => func(...args)),
});

contextBridge.exposeInMainWorld('Toastify', {
  toast: (options) => Toastify(options).showToast(),
});
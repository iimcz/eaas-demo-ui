import {
    MachineBuilder
} from '../../lib/machineBuilder.js'

import {Drives} from '../../lib/drives.js'

module.exports = ["$http", "$state", "systemList", "softwareList", "localConfig", "$uibModal", "os", "Objects", "Images",
    function ($http,  $state, systemList, softwareList, localConfig, $uibModal, os, Objects, Images) {
        var vm = this;

        vm.systems = systemList.data;
        vm.softwareList = softwareList.data.descriptions; 
        vm.osPresets = os.operatingSystems;

        vm.native_config = "";
        vm.uiOptions = {};
    
        vm.objectList = [];
        Objects.query({archiveId: "zero conf"}).$promise.then(function(response) {
            vm.objectList = response;
        });

        vm.imageId = "";
        vm._preSelectedSystem = undefined;
        vm.selectedOs = undefined;
        vm.imageList = [];
        vm.runtimeList = [];

        vm.builder = new MachineBuilder(localConfig.data.eaasBackendURL, localStorage.getItem('id_token'));

        Images.list().then((result) => {
            vm.imageList = result;
        }, (e) => {
            throw new Error(e);
        });

        Images.runtimeImages().then((result) => {
            vm.runtimeList = result;
        }, (e) => {
            throw new Error(e);
        });

        vm.config = {
            cpu: undefined,
            memory: undefined,
            kvm_available: false,
            kvm_enabled: false,
        }

        vm.preSelectedSystem = function(os)
        {
            vm._preSelectedSystem = os;
            vm.selectedTemplate = "";
            vm.config = {
                cpu: undefined,
                memory: undefined,
                kvm_available: false,
                kvm_enabled: false,
                template: undefined,
            }
        }

        vm.getOsPresets = function()
        {
            const result =  os.operatingSystems.filter(
                (element, i) => { 
                    let templates = vm.systems.find(o => o.id === element.template);
                    if(element.id.startsWith("os:" +  vm._preSelectedSystem) && templates)
                        return true;
                    return false;
                }
            );
            if(!result)
                return [];
            return result;
        }

        vm.guessBinding = function(index)
        {
            return vm.drives.renderBinding(index, vm.imageList, vm.softwareList, vm.objectList);
        }

        vm.selectMedium = function (index) {
            vm.drives.selectMedia(index, vm.imageList, vm.softwareList, vm.objectList, vm.runtimeList, $uibModal);
        }

        vm.onSelectSystem = function (item) {
            vm.selectedOs = item;
            vm.config.kvm_available = vm.selectedOs.kvm_available;
            vm.config.template = vm.selectedOs.template;
            vm.config.template_params = vm.selectedOs.template_params;
            
            vm.osId = vm.selectedOs.id;
            vm.template = vm.systems.find(o => o.id === vm.selectedOs.template);

            if(!vm.template) {
                console.log(item);
                console.log(vm.systems);
                throw new Error("no template found: ");
            }
            
            vm.drives = new Drives(vm.template.drive);
            vm.native_config = updateNativeConfig();
        };

        function updateNativeConfig() {
            let confStr = "";

            if (vm.config.template_params.vga)
                confStr += " -vga " + vm.config.template_params.vga;

            if (vm.config.template_params.cpu)
                confStr += " -smp " + vm.config.template_params.cpu;

            if (vm.config.template_params.net)
                confStr += " -net nic,model=" + vm.config.template_params.net;

            if (vm.config.template_params.audio)
                confStr += " -soundhw " + vm.config.template_params.audio;

            if (vm.config.template_params.memory)
                confStr += " -m " + vm.config.template_params.memory;

            if (vm.config.template_params.pointer === 'usb')
                confStr += " -usb -usbdevice tablet"

            if (vm.config.template_params.kvm_enabled)
                confStr += " -enable-kvm"

            if (confStr.startsWith(" "))
                confStr = confStr.substring(1);
            return confStr;
        }

        vm.updateQemu = function () {
            vm.native_config = updateNativeConfig();
        }

        vm.updateMacemu = function () {
        
        }

        vm.save = function () {
            try {
                vm.builder.label = vm.label;
                vm.builder.nativeConfig = vm.native_config;
                vm.builder.templateId = vm.template.id;
                vm.builder.operatingSystemId = vm.osId;
                vm.builder.uiOptions = vm.uiOptions;
                vm.builder.setDrives(vm.drives);

                if(vm.config.template_params.rom)
                {
                    vm.builder.setRom(vm.config.template_params.rom.imageId, vm.config.template_params.rom.label)
                }

                vm.builder.build()
                    .then(() => $state.go('admin.standard-envs-overview', {}, {
                        reload: true
                    }))
                    .catch((e) => $state.go('error', {
                        errorMsg: e
                    }));
            } catch (e) {
                console.log(e);
                $state.go('error', {
                    errorMsg: e
                });
            }
        }
    }
];
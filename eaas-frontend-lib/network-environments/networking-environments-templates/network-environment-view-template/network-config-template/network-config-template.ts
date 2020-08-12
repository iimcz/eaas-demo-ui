import {Component, Input} from '@angular/core';

@Component({
    selector: 'network-config-template',
    template: require('./network-config-template.html'),
})
export class NetworkConfigTemplate {
    @Input() networkingConfig: any;
    @Input() isDisabled: boolean;
    @Input() environments: any;
    isDnsDefined: boolean;
    startDate = new Date(2000, 0, 1);

    ngAfterViewInit() {
        this.isDnsDefined = !!this.networkingConfig.dnsServiceEnv;
        // if the view is not interactive, environments are not passed, but dnsServiceEnv is defined: render dnsServiceEnv
        if (this.isDisabled && this.environments == undefined) {
            this.environments = [];
            if (this.isDnsDefined)
                this.environments.push(this.networkingConfig.dnsServiceEnv);
            if (this.networkingConfig.isShared)
                this.environments.push(this.networkingConfig.startupEnv)
        }
    }

    updateNetworkDescription(newDesc) {
        this.networkingConfig.description = newDesc;
    }

    ensureDNSexclusivity($event: any, caseNum: number) {
        switch(caseNum) {
            case 1:
                this.networkingConfig.isDHCPenabled = false;
                break;
            case 2:
                this.isDnsDefined = false;
                break;
        }
    }
}

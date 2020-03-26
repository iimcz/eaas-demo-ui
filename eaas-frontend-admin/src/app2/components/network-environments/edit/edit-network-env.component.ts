import {AfterViewInit, Component, Inject, Input, ViewChild} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {NetworkEnvironmentView} from "EaasLibs/network-environments/networking-environments-templates/network-environment-view-template/network-environment-view.component.ts";
import {NgForm} from "@angular/forms";
import * as uuid from "uuid";
import {saveNetworkEnv} from "EaasLibs/network-environments/network-environment-saver.ts";

@Component({
    selector: 'edit-network-environment',
    template: require('./edit-network-env.html'),
})
export class EditNetworkComponent implements AfterViewInit {
    @Input() selectedNetworkEnvironment: any;
    @Input() environments: any;

    @ViewChild(NetworkEnvironmentView, {static: false})
    private networkEnvironmentView: NetworkEnvironmentView;
    private networkingConfig: any;

    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any) {
    };

    ngOnInit() {
        this.networkingConfig = {
            serverMode: this.selectedNetworkEnvironment.networking.serverMode,
            isDHCPenabled: this.selectedNetworkEnvironment.networking.isDHCPenabled,
            enableInternet: this.selectedNetworkEnvironment.networking.enableInternet,
            localServerMode: this.selectedNetworkEnvironment.networking.localServerMode,
            enableSocks: this.selectedNetworkEnvironment.networking.enableSocks,
            dhcpNetworkMask: this.selectedNetworkEnvironment.networking.dhcpNetworkMask,
            dhcpNetworkAddress: this.selectedNetworkEnvironment.networking.dhcpNetworkAddress,
            isArchivedInternetEnabled: this.selectedNetworkEnvironment.networking.isArchivedInternetEnabled,
            allowExternalConnections: this.selectedNetworkEnvironment.networking.allowExternalConnections,
            archiveInternetDate: this.selectedNetworkEnvironment.networking.archiveInternetDate,
            network: this.selectedNetworkEnvironment.network,
            gateway: this.selectedNetworkEnvironment.gateway,
            upstream_dns: this.selectedNetworkEnvironment.upstream_dns,
            dnsServiceEnvId: this.selectedNetworkEnvironment.dnsServiceEnvId,
            startupEnvId: this.selectedNetworkEnvironment.startupEnvId,
            isShared: !!this.selectedNetworkEnvironment.startupEnvId,
            description: this.selectedNetworkEnvironment.description,
        };
        // enrich chosenEnvs with title and implicit id
        if (this.selectedNetworkEnvironment.emilEnvironments.length > 0) {
            this.selectedNetworkEnvironment.emilEnvironments.forEach(networkElement => {
                    networkElement.title = this.environments.find((env => env.envId == networkElement.envId)).title;
                    networkElement.uiID = uuid.v4();
                }
            )
        }
    }

    ngAfterViewInit() {
        this.networkEnvironmentView.submitForm = (f: NgForm) => {
            if (f.valid) {
                // You will get form value if your form is valid
                saveNetworkEnv(this.http,
                    'post',
                    `${this.localConfig.data.eaasBackendURL}${this.REST_URLS.networkEnvironmentUrl}`,
                    this.networkEnvironmentView,
                    this.selectedNetworkEnvironment.envId)
                    .subscribe((reply: any) => {
                        if (reply.status == "0") {
                            this.growl.success("Done");
                            this.$state.go('admin.standard-envs-overview', {
                                showObjects: false,
                                showContainers: false,
                                showNetworkEnvs: true
                            }, {reload: true});
                        } else {
                            this.growl.error("Saved failed! ", reply);
                            console.log(reply);
                        }
                    });
            } else {
                f.form.controls['evnLabel'].markAsTouched();
            }
        };
    }
}

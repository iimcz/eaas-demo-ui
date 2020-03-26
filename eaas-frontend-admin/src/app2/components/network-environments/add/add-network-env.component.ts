import {AfterViewInit, Component, Inject, Input} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {HttpClient} from "@angular/common/http";
import {ViewChild} from '@angular/core';
import * as uuid from "uuid";
import {NgForm} from '@angular/forms';
import {NetworkEnvironmentView} from "EaasLibs/network-environments/networking-environments-templates/network-environment-view-template/network-environment-view.component.ts";
import {saveNetworkEnv} from "EaasLibs/network-environments/network-environment-saver.ts";


@Component({
    selector: 'add-network-environment',
    template: require('./add-network-env.html'),
})
export class AddNetworkComponent implements AfterViewInit {
    @Input() environments: any;
    @ViewChild(NetworkEnvironmentView, {static: false})
    private networkEnvironmentView: NetworkEnvironmentView;

    constructor(public dialog: MatDialog,
                private http: HttpClient,
                @Inject('$state') private $state: any,
                @Inject('REST_URLS') private REST_URLS: any,
                @Inject('localConfig') private localConfig: any,
                @Inject('growl') private growl: any) {
    }

    ngAfterViewInit() {
        // Override submitForm
        this.networkEnvironmentView.submitForm = (f: NgForm) => {
            if (f.valid) {
                // You will get form value if your form is valid
                // You will get form value if your form is valid
                saveNetworkEnv(this.http,
                    'put',
                    `${this.localConfig.data.eaasBackendURL}${this.REST_URLS.networkEnvironmentUrl}`,
                    this.networkEnvironmentView,
                    uuid.v4())
                    .subscribe((reply: any) => {
                        if (reply.status == "0") {
                            this.growl.success("Done");
                            this.$state.go('admin.standard-envs-overview', {}, {reload: true});
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

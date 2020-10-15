// tslint:disable
/**
 * OH 2.0 Api Documentation
 * OH 2.0 Api Documentation
 *
 * The version of the OpenAPI document: 1.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { Observable } from 'rxjs';
import { BaseAPI, HttpHeaders, throwIfNullOrUndefined, encodeURI } from '../runtime';
import {
    DischargeTypeDTO,
} from '../models';

export interface DeleteDischargeTypeUsingDELETERequest {
    code: string;
}

export interface NewDischargeTypeUsingPOSTRequest {
    dischTypeDTO: DischargeTypeDTO;
}

export interface UpdateDischargeTypetUsingPUTRequest {
    dischTypeDTO: DischargeTypeDTO;
}

/**
 * no description
 */
export class DischargeTypeControllerApi extends BaseAPI {

    /**
     * deleteDischargeType
     */
    deleteDischargeTypeUsingDELETE = ({ code }: DeleteDischargeTypeUsingDELETERequest): Observable<boolean> => {
        throwIfNullOrUndefined(code, 'deleteDischargeTypeUsingDELETE');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<boolean>({
            path: '/dischargetypes/{code}'.replace('{code}', encodeURI(code)),
            method: 'DELETE',
            headers,
        });
    };

    /**
     * getDischargeTypes
     */
    getDischargeTypesUsingGET = (): Observable<Array<DischargeTypeDTO>> => {
        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<Array<DischargeTypeDTO>>({
            path: '/dischargetypes',
            method: 'GET',
            headers,
        });
    };

    /**
     * newDischargeType
     */
    newDischargeTypeUsingPOST = ({ dischTypeDTO }: NewDischargeTypeUsingPOSTRequest): Observable<string> => {
        throwIfNullOrUndefined(dischTypeDTO, 'newDischargeTypeUsingPOST');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<string>({
            path: '/dischargetypes',
            method: 'POST',
            headers,
            body: dischTypeDTO,
        });
    };

    /**
     * updateDischargeTypet
     */
    updateDischargeTypetUsingPUT = ({ dischTypeDTO }: UpdateDischargeTypetUsingPUTRequest): Observable<string> => {
        throwIfNullOrUndefined(dischTypeDTO, 'updateDischargeTypetUsingPUT');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<string>({
            path: '/dischargetypes',
            method: 'PUT',
            headers,
            body: dischTypeDTO,
        });
    };

}

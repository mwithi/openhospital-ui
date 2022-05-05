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
import { BaseAPI, HttpHeaders, HttpQuery, throwIfNullOrUndefined, encodeURI, OperationOpts, RawAjaxResponse } from '../runtime';
import {
    OpdDTO,
    OperationDTO,
    OperationRowDTO,
} from '../models';

export interface DeleteOperationRowUsingDELETERequest {
    code: number;
}

export interface DeleteOperationUsingDELETERequest {
    code: string;
}

export interface GetOperationByCodeUsingGETRequest {
    code: string;
}

export interface GetOperationByTypeDescriptionUsingGETRequest {
    typeDescription: string;
}

export interface GetOperationRowsByAdmtUsingGETRequest {
    admissionId: number;
}

export interface GetOperationRowsByOpdUsingPOSTRequest {
    opdDTO: OpdDTO;
}

export interface NewOperationRowUsingPOSTRequest {
    operationRowDTO: OperationRowDTO;
}

export interface NewOperationUsingPOSTRequest {
    operationDTO: OperationDTO;
}

export interface UpdateOperationRowUsingPUTRequest {
    operationRowDTO: OperationRowDTO;
}

export interface UpdateOperationUsingPUTRequest {
    code: string;
    operationDTO: OperationDTO;
}

/**
 * no description
 */
export class OperationControllerApi extends BaseAPI {

    /**
     * deleteOperationRow
     */
    deleteOperationRowUsingDELETE({ code }: DeleteOperationRowUsingDELETERequest): Observable<boolean>
    deleteOperationRowUsingDELETE({ code }: DeleteOperationRowUsingDELETERequest, opts?: OperationOpts): Observable<RawAjaxResponse<boolean>>
    deleteOperationRowUsingDELETE({ code }: DeleteOperationRowUsingDELETERequest, opts?: OperationOpts): Observable<boolean | RawAjaxResponse<boolean>> {
        throwIfNullOrUndefined(code, 'code', 'deleteOperationRowUsingDELETE');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<boolean>({
            url: '/operations/rows/{code}'.replace('{code}', encodeURI(code)),
            method: 'DELETE',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * deleteOperation
     */
    deleteOperationUsingDELETE({ code }: DeleteOperationUsingDELETERequest): Observable<boolean>
    deleteOperationUsingDELETE({ code }: DeleteOperationUsingDELETERequest, opts?: OperationOpts): Observable<RawAjaxResponse<boolean>>
    deleteOperationUsingDELETE({ code }: DeleteOperationUsingDELETERequest, opts?: OperationOpts): Observable<boolean | RawAjaxResponse<boolean>> {
        throwIfNullOrUndefined(code, 'code', 'deleteOperationUsingDELETE');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<boolean>({
            url: '/operations/{code}'.replace('{code}', encodeURI(code)),
            method: 'DELETE',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * getOperationByCode
     */
    getOperationByCodeUsingGET({ code }: GetOperationByCodeUsingGETRequest): Observable<OperationDTO>
    getOperationByCodeUsingGET({ code }: GetOperationByCodeUsingGETRequest, opts?: OperationOpts): Observable<RawAjaxResponse<OperationDTO>>
    getOperationByCodeUsingGET({ code }: GetOperationByCodeUsingGETRequest, opts?: OperationOpts): Observable<OperationDTO | RawAjaxResponse<OperationDTO>> {
        throwIfNullOrUndefined(code, 'code', 'getOperationByCodeUsingGET');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<OperationDTO>({
            url: '/operations/{code}'.replace('{code}', encodeURI(code)),
            method: 'GET',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * getOperationByTypeDescription
     */
    getOperationByTypeDescriptionUsingGET({ typeDescription }: GetOperationByTypeDescriptionUsingGETRequest): Observable<Array<OperationDTO>>
    getOperationByTypeDescriptionUsingGET({ typeDescription }: GetOperationByTypeDescriptionUsingGETRequest, opts?: OperationOpts): Observable<RawAjaxResponse<Array<OperationDTO>>>
    getOperationByTypeDescriptionUsingGET({ typeDescription }: GetOperationByTypeDescriptionUsingGETRequest, opts?: OperationOpts): Observable<Array<OperationDTO> | RawAjaxResponse<Array<OperationDTO>>> {
        throwIfNullOrUndefined(typeDescription, 'typeDescription', 'getOperationByTypeDescriptionUsingGET');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        const query: HttpQuery = { // required parameters are used directly since they are already checked by throwIfNullOrUndefined
            'typeDescription': typeDescription,
        };

        return this.request<Array<OperationDTO>>({
            url: '/operations/search/type',
            method: 'GET',
            headers,
            query,
        }, opts?.responseOpts);
    };

    /**
     * getOperationRowsByAdmt
     */
    getOperationRowsByAdmtUsingGET({ admissionId }: GetOperationRowsByAdmtUsingGETRequest): Observable<Array<OperationRowDTO>>
    getOperationRowsByAdmtUsingGET({ admissionId }: GetOperationRowsByAdmtUsingGETRequest, opts?: OperationOpts): Observable<RawAjaxResponse<Array<OperationRowDTO>>>
    getOperationRowsByAdmtUsingGET({ admissionId }: GetOperationRowsByAdmtUsingGETRequest, opts?: OperationOpts): Observable<Array<OperationRowDTO> | RawAjaxResponse<Array<OperationRowDTO>>> {
        throwIfNullOrUndefined(admissionId, 'admissionId', 'getOperationRowsByAdmtUsingGET');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        const query: HttpQuery = { // required parameters are used directly since they are already checked by throwIfNullOrUndefined
            'admissionId': admissionId,
        };

        return this.request<Array<OperationRowDTO>>({
            url: '/operations/rows/search/admission',
            method: 'GET',
            headers,
            query,
        }, opts?.responseOpts);
    };

    /**
     * getOperationRowsByOpd
     */
    getOperationRowsByOpdUsingPOST({ opdDTO }: GetOperationRowsByOpdUsingPOSTRequest): Observable<Array<OperationRowDTO>>
    getOperationRowsByOpdUsingPOST({ opdDTO }: GetOperationRowsByOpdUsingPOSTRequest, opts?: OperationOpts): Observable<RawAjaxResponse<Array<OperationRowDTO>>>
    getOperationRowsByOpdUsingPOST({ opdDTO }: GetOperationRowsByOpdUsingPOSTRequest, opts?: OperationOpts): Observable<Array<OperationRowDTO> | RawAjaxResponse<Array<OperationRowDTO>>> {
        throwIfNullOrUndefined(opdDTO, 'opdDTO', 'getOperationRowsByOpdUsingPOST');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<Array<OperationRowDTO>>({
            url: '/operations/rows/search/opd',
            method: 'POST',
            headers,
            body: opdDTO,
        }, opts?.responseOpts);
    };

    /**
     * getOperations
     */
    getOperationsUsingGET(): Observable<Array<OperationDTO>>
    getOperationsUsingGET(opts?: OperationOpts): Observable<RawAjaxResponse<Array<OperationDTO>>>
    getOperationsUsingGET(opts?: OperationOpts): Observable<Array<OperationDTO> | RawAjaxResponse<Array<OperationDTO>>> {
        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<Array<OperationDTO>>({
            url: '/operations',
            method: 'GET',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * newOperationRow
     */
    newOperationRowUsingPOST({ operationRowDTO }: NewOperationRowUsingPOSTRequest): Observable<number>
    newOperationRowUsingPOST({ operationRowDTO }: NewOperationRowUsingPOSTRequest, opts?: OperationOpts): Observable<RawAjaxResponse<number>>
    newOperationRowUsingPOST({ operationRowDTO }: NewOperationRowUsingPOSTRequest, opts?: OperationOpts): Observable<number | RawAjaxResponse<number>> {
        throwIfNullOrUndefined(operationRowDTO, 'operationRowDTO', 'newOperationRowUsingPOST');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<number>({
            url: '/operations/rows',
            method: 'POST',
            headers,
            body: operationRowDTO,
        }, opts?.responseOpts);
    };

    /**
     * newOperation
     */
    newOperationUsingPOST({ operationDTO }: NewOperationUsingPOSTRequest): Observable<string>
    newOperationUsingPOST({ operationDTO }: NewOperationUsingPOSTRequest, opts?: OperationOpts): Observable<RawAjaxResponse<string>>
    newOperationUsingPOST({ operationDTO }: NewOperationUsingPOSTRequest, opts?: OperationOpts): Observable<string | RawAjaxResponse<string>> {
        throwIfNullOrUndefined(operationDTO, 'operationDTO', 'newOperationUsingPOST');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<string>({
            url: '/operations',
            method: 'POST',
            headers,
            body: operationDTO,
        }, opts?.responseOpts);
    };

    /**
     * updateOperationRow
     */
    updateOperationRowUsingPUT({ operationRowDTO }: UpdateOperationRowUsingPUTRequest): Observable<number>
    updateOperationRowUsingPUT({ operationRowDTO }: UpdateOperationRowUsingPUTRequest, opts?: OperationOpts): Observable<RawAjaxResponse<number>>
    updateOperationRowUsingPUT({ operationRowDTO }: UpdateOperationRowUsingPUTRequest, opts?: OperationOpts): Observable<number | RawAjaxResponse<number>> {
        throwIfNullOrUndefined(operationRowDTO, 'operationRowDTO', 'updateOperationRowUsingPUT');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<number>({
            url: '/operations/rows',
            method: 'PUT',
            headers,
            body: operationRowDTO,
        }, opts?.responseOpts);
    };

    /**
     * updateOperation
     */
    updateOperationUsingPUT({ code, operationDTO }: UpdateOperationUsingPUTRequest): Observable<string>
    updateOperationUsingPUT({ code, operationDTO }: UpdateOperationUsingPUTRequest, opts?: OperationOpts): Observable<RawAjaxResponse<string>>
    updateOperationUsingPUT({ code, operationDTO }: UpdateOperationUsingPUTRequest, opts?: OperationOpts): Observable<string | RawAjaxResponse<string>> {
        throwIfNullOrUndefined(code, 'code', 'updateOperationUsingPUT');
        throwIfNullOrUndefined(operationDTO, 'operationDTO', 'updateOperationUsingPUT');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<string>({
            url: '/operations/{code}'.replace('{code}', encodeURI(code)),
            method: 'PUT',
            headers,
            body: operationDTO,
        }, opts?.responseOpts);
    };

}
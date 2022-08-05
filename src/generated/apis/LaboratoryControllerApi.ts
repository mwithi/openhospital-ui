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
    LabWithRowsDTO,
    LaboratoryDTO,
    LaboratoryForPrintDTO,
    ResponseEntity,
} from '../models';

export interface DeleteExamUsingDELETE2Request {
    code: number;
}

export interface GetLabWithRowsByIdUsingGETRequest {
    code: number;
}

export interface GetLaboratoryByIdUsingGETRequest {
    code: number;
}

export interface GetLaboratoryForPrintUsingGETRequest {
    dateFrom: string;
    dateTo: string;
    examName?: string;
    patientCode?: number;
}

export interface GetLaboratoryUsingGETRequest {
    patId: number;
}

export interface NewLaboratory2UsingPOSTRequest {
    labsWithRows: Array<LabWithRowsDTO>;
}

export interface NewLaboratoryUsingPOSTRequest {
    labWithRowsDTO: LabWithRowsDTO;
}

export interface UpdateLaboratoryUsingPUTRequest {
    code: number;
    labWithRowsDTO: LabWithRowsDTO;
}

/**
 * no description
 */
export class LaboratoryControllerApi extends BaseAPI {

    /**
     * deleteExam
     */
    deleteExamUsingDELETE2({ code }: DeleteExamUsingDELETE2Request): Observable<ResponseEntity>
    deleteExamUsingDELETE2({ code }: DeleteExamUsingDELETE2Request, opts?: OperationOpts): Observable<RawAjaxResponse<ResponseEntity>>
    deleteExamUsingDELETE2({ code }: DeleteExamUsingDELETE2Request, opts?: OperationOpts): Observable<ResponseEntity | RawAjaxResponse<ResponseEntity>> {
        throwIfNullOrUndefined(code, 'code', 'deleteExamUsingDELETE2');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<ResponseEntity>({
            url: '/laboratories/{code}'.replace('{code}', encodeURI(code)),
            method: 'DELETE',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * getExamWithRowsById
     */
    getLabWithRowsByIdUsingGET({ code }: GetLabWithRowsByIdUsingGETRequest): Observable<LabWithRowsDTO>
    getLabWithRowsByIdUsingGET({ code }: GetLabWithRowsByIdUsingGETRequest, opts?: OperationOpts): Observable<RawAjaxResponse<LabWithRowsDTO>>
    getLabWithRowsByIdUsingGET({ code }: GetLabWithRowsByIdUsingGETRequest, opts?: OperationOpts): Observable<LabWithRowsDTO | RawAjaxResponse<LabWithRowsDTO>> {
        throwIfNullOrUndefined(code, 'code', 'getLabWithRowsByIdUsingGET');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<LabWithRowsDTO>({
            url: '/laboratories/exams/{code}'.replace('{code}', encodeURI(code)),
            method: 'GET',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * getExamById
     */
    getLaboratoryByIdUsingGET({ code }: GetLaboratoryByIdUsingGETRequest): Observable<LaboratoryDTO>
    getLaboratoryByIdUsingGET({ code }: GetLaboratoryByIdUsingGETRequest, opts?: OperationOpts): Observable<RawAjaxResponse<LaboratoryDTO>>
    getLaboratoryByIdUsingGET({ code }: GetLaboratoryByIdUsingGETRequest, opts?: OperationOpts): Observable<LaboratoryDTO | RawAjaxResponse<LaboratoryDTO>> {
        throwIfNullOrUndefined(code, 'code', 'getLaboratoryByIdUsingGET');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<LaboratoryDTO>({
            url: '/laboratories/{code}'.replace('{code}', encodeURI(code)),
            method: 'GET',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * getLaboratoryForPrint
     */
    getLaboratoryForPrintUsingGET({ dateFrom, dateTo, examName, patientCode }: GetLaboratoryForPrintUsingGETRequest): Observable<Array<LaboratoryForPrintDTO>>
    getLaboratoryForPrintUsingGET({ dateFrom, dateTo, examName, patientCode }: GetLaboratoryForPrintUsingGETRequest, opts?: OperationOpts): Observable<RawAjaxResponse<Array<LaboratoryForPrintDTO>>>
    getLaboratoryForPrintUsingGET({ dateFrom, dateTo, examName, patientCode }: GetLaboratoryForPrintUsingGETRequest, opts?: OperationOpts): Observable<Array<LaboratoryForPrintDTO> | RawAjaxResponse<Array<LaboratoryForPrintDTO>>> {
        throwIfNullOrUndefined(dateFrom, 'dateFrom', 'getLaboratoryForPrintUsingGET');
        throwIfNullOrUndefined(dateTo, 'dateTo', 'getLaboratoryForPrintUsingGET');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        const query: HttpQuery = { // required parameters are used directly since they are already checked by throwIfNullOrUndefined
            'dateFrom': dateFrom,
            'dateTo': dateTo,
        };

        if (examName != null) { query['examName'] = examName; }
        if (patientCode != null) { query['patientCode'] = patientCode; }

        return this.request<Array<LaboratoryForPrintDTO>>({
            url: '/laboratories/exams',
            method: 'GET',
            headers,
            query,
        }, opts?.responseOpts);
    };

    /**
     * getLaboratory
     */
    getLaboratoryUsingGET({ patId }: GetLaboratoryUsingGETRequest): Observable<Array<LaboratoryDTO>>
    getLaboratoryUsingGET({ patId }: GetLaboratoryUsingGETRequest, opts?: OperationOpts): Observable<RawAjaxResponse<Array<LaboratoryDTO>>>
    getLaboratoryUsingGET({ patId }: GetLaboratoryUsingGETRequest, opts?: OperationOpts): Observable<Array<LaboratoryDTO> | RawAjaxResponse<Array<LaboratoryDTO>>> {
        throwIfNullOrUndefined(patId, 'patId', 'getLaboratoryUsingGET');

        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<Array<LaboratoryDTO>>({
            url: '/laboratories/byPatientId/{patId}'.replace('{patId}', encodeURI(patId)),
            method: 'GET',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * getLaboratory
     */
    getLaboratoryUsingGET1(): Observable<Array<LaboratoryDTO>>
    getLaboratoryUsingGET1(opts?: OperationOpts): Observable<RawAjaxResponse<Array<LaboratoryDTO>>>
    getLaboratoryUsingGET1(opts?: OperationOpts): Observable<Array<LaboratoryDTO> | RawAjaxResponse<Array<LaboratoryDTO>>> {
        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<Array<LaboratoryDTO>>({
            url: '/laboratories',
            method: 'GET',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * getMaterials
     */
    getMaterialsUsingGET(): Observable<Array<string>>
    getMaterialsUsingGET(opts?: OperationOpts): Observable<RawAjaxResponse<Array<string>>>
    getMaterialsUsingGET(opts?: OperationOpts): Observable<Array<string> | RawAjaxResponse<Array<string>>> {
        const headers: HttpHeaders = {
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<Array<string>>({
            url: '/laboratories/materials',
            method: 'GET',
            headers,
        }, opts?.responseOpts);
    };

    /**
     * newLaboratory2
     */
    newLaboratory2UsingPOST({ labsWithRows }: NewLaboratory2UsingPOSTRequest): Observable<ResponseEntity>
    newLaboratory2UsingPOST({ labsWithRows }: NewLaboratory2UsingPOSTRequest, opts?: OperationOpts): Observable<RawAjaxResponse<ResponseEntity>>
    newLaboratory2UsingPOST({ labsWithRows }: NewLaboratory2UsingPOSTRequest, opts?: OperationOpts): Observable<ResponseEntity | RawAjaxResponse<ResponseEntity>> {
        throwIfNullOrUndefined(labsWithRows, 'labsWithRows', 'newLaboratory2UsingPOST');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<ResponseEntity>({
            url: '/laboratories/insertList',
            method: 'POST',
            headers,
            body: labsWithRows,
        }, opts?.responseOpts);
    };

    /**
     * newLaboratory
     */
    newLaboratoryUsingPOST({ labWithRowsDTO }: NewLaboratoryUsingPOSTRequest): Observable<boolean>
    newLaboratoryUsingPOST({ labWithRowsDTO }: NewLaboratoryUsingPOSTRequest, opts?: OperationOpts): Observable<RawAjaxResponse<boolean>>
    newLaboratoryUsingPOST({ labWithRowsDTO }: NewLaboratoryUsingPOSTRequest, opts?: OperationOpts): Observable<boolean | RawAjaxResponse<boolean>> {
        throwIfNullOrUndefined(labWithRowsDTO, 'labWithRowsDTO', 'newLaboratoryUsingPOST');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<boolean>({
            url: '/laboratories',
            method: 'POST',
            headers,
            body: labWithRowsDTO,
        }, opts?.responseOpts);
    };

    /**
     * updateLaboratory
     */
    updateLaboratoryUsingPUT({ code, labWithRowsDTO }: UpdateLaboratoryUsingPUTRequest): Observable<ResponseEntity>
    updateLaboratoryUsingPUT({ code, labWithRowsDTO }: UpdateLaboratoryUsingPUTRequest, opts?: OperationOpts): Observable<RawAjaxResponse<ResponseEntity>>
    updateLaboratoryUsingPUT({ code, labWithRowsDTO }: UpdateLaboratoryUsingPUTRequest, opts?: OperationOpts): Observable<ResponseEntity | RawAjaxResponse<ResponseEntity>> {
        throwIfNullOrUndefined(code, 'code', 'updateLaboratoryUsingPUT');
        throwIfNullOrUndefined(labWithRowsDTO, 'labWithRowsDTO', 'updateLaboratoryUsingPUT');

        const headers: HttpHeaders = {
            'Content-Type': 'application/json',
            ...(this.configuration.apiKey && { 'Authorization': this.configuration.apiKey('Authorization') }), // JWT authentication
        };

        return this.request<ResponseEntity>({
            url: '/laboratories/{code}'.replace('{code}', encodeURI(code)),
            method: 'PUT',
            headers,
            body: labWithRowsDTO,
        }, opts?.responseOpts);
    };

}

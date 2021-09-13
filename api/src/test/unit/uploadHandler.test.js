import { describe, test, expect, jest } from "@jest/globals";
import UploadHandler from "../../uploadHandler";
import TestUtil from "./_util/testUtil";
import fs from 'fs'
import { resolve } from "path";

describe("#UploadHandler test suite", () => {
    const ioObj = {
        to: (id) => ioObj,
        emit: (event, message) => {},
      };
    describe('#registerEvents', () => {
        test('Should call onFile and onFinish functions on Busboy instance', () => {
            const uploadHandler = new UploadHandler({
                io: ioObj,
                socketId: '01'
            })

            jest.spyOn(uploadHandler, uploadHandler.onFile.name).mockResolvedValue()

            const headers = {
                'content-type': 'multipart/form-data; boundary='
            }
            const onFinish = jest.fn()
            const busboyInstance = uploadHandler.registerEvents(headers, onFinish)

            const fileSteam = TestUtil.generateReadableSteam(['chunk','of','data'])
            busboyInstance.emit('file', 'fieldname', fileSteam, 'filename.txt')
            busboyInstance.listeners('finish')[0].call()
            expect(uploadHandler.onFile).toHaveBeenCalled()
            expect(onFinish).toHaveBeenCalled()
        })
    });

    describe('#onFile', () => {
        test('given a stream file it should save it on disk', async () => {
            const chunks = ['hey', 'dude']
            const downloadsFolder = '/tmp'
            const handler = new UploadHandler({
                io: ioObj,
                socketId: '01',
                downloadsFolder
            })
            const onData = jest.fn()
            jest.spyOn(fs, fs.createWriteStream.name)
                .mockImplementation(() => TestUtil.generateReadableSteam(onData))

            const onTransform = jest.fn()
            jest.spyOn(handler, handler.handleFileBytes.name)
                .mockImplementation(() => TestUtil.generateTransformStream(onTransform))

            const params = {
                fieldname: 'video',
                file: TestUtil.generateReadableSteam(chunks),
                filename: 'test.mov'
            }

            await handler.onFile(...Object.values(params))

            expect(onData.mock.calls.join()).toEqual(chunks.join())
            expect(onTransform.mock.calls.join()).toEqual(chunks.join())

            const expectedFilename = resolve(handler.downloadsFolder, params.filename)
            expect(fs.createWriteStream).toHaveBeenCalledWith(expectedFilename)
        });
    });
})
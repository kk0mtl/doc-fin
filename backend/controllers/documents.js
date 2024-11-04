const Document = require('../models/document');
// const User = require('../models/user');

// exports.createDocument = async (req, res) => {
//     try {
//         const { title, content, access } = req.body;
//         const owner = req.user._id;
//         const document = new Document({ title, content, owner});
//         await document.save();
//         res.status(201).json({ document });
//     } catch (error) {
//         res.status(500).json({ error });
//     }
// };

// documents.js
exports.createDocument = async (roomId) => {
    try {
        const title = "Untitled Document";
        if (!roomId) {
            throw new Error("roomId is required");
        }
        const document = new Document({ title, roomId });
        await document.save();
        return document;
    } catch (error) {
        console.log("Error in doc creation", error);
    }
};

// exports.getAllDocuments = async (req, res) => {
//     try {
//         const documents = await Document.find({ owner: req.user._id });
//         res.status(200).json({ documents });
//     } catch (error) {
//         res.status(500).json({ error });
//     }
// };


// exports.getAllDocuments = async (userId) => {
//     try {
//         const documents = await Document.find({ owner: userId });
//         return documents;
//     } catch (error) {
//         console.log("error in finding doc", error)
//     }
// }

// exports.getDocumentByUUID = async (req, res) => {
//     try {
//         const { uuid } = req.params;
//         const document = await Document.findOne({ uuid });
//         if (!document) {
//             return res.status(404).json({ error: 'Document not found' });
//         }
//         res.status(200).json({ document });
//     } catch (error) {
//         res.status(500).json({ error });
//     }
// };

exports.getDocumentByRoomId = async (roomId) => {
    try {
        const document = await Document.findOne({ roomId }); // roomId로 찾음
        if (!document) {
            console.log("Document not found");
            return;
        }
        return document;
    } catch (error) {
        console.log("Error in finding document", error);
    }
};


// exports.updateDocument = async (req, res) => {
//     try {
//         const { uuid } = req.params;
//         const { title, content, access } = req.body;
//         const document = await Document.findOne({ uuid });
//         if (!document) {
//             return res.status(404).json({ error: 'Document not found' });
//         }
//         document.title = title;
//         document.content = content;
//         document.access = access;
//         document.updatedAt = Date.now();
//         await document.save();
//         res.status(200).json({ document });
//     } catch (error) {
//         res.status(500).json({ error });
//     }
// };

exports.updateDocument = async (roomId, content) => {
    try {
        const document = await Document.findOne({ roomId }); // roomId로 찾음
        if (!document) {
            console.log("Document not found while updating");
            return;
        }
        document.title = content.title;
        document.content = content.content;
        document.updatedAt = Date.now();
        await document.save();
        return document;
    } catch (error) {
        console.log("Error in updating document", error);
    }
};

// exports.deleteDocument = async (userId, docId) => {
//     try {
//         const document = await Document.findOne({ _id: id, owner: req.user._id });
//         if (!document) {
//             console.log(`Document deleted of docId ${docId}`)
//         }
//         await document.remove();
//     } catch (error) {
//         console.log("Error in doc creation", error)
//     }
// }
// exports.deleteDocument = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const document = await Document.findOne({ _id: id, owner: req.user._id });
//         if (!document) {
//             return res.status(404).json({ error: 'Document not found' });
//         }
//         await document.remove();
//         res.status(200).json({ message: 'Document deleted successfully' });
//     } catch (error) {
//         res.status(500).json({ error });
//     }
// };

// exports.deleteDocument = async (uuid) => {
//     try {
//         const document = await Document.findOne({ _id: uuid });
//         if (!document) {
//             return res.status(404).json({ error: 'While deleting, Document not found' });
//         }
//         await document.remove();
//         return document;
//     } catch (error) {
//         console.log("doc couldnt be deleted", error)
//     }
// }


// exports.addCollaborator = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { email } = req.body;
//         const document = await Document.findOne({ _id: id, owner: req.user._id });
//         if (!document) {
//             return res.status(404).json({ error: 'Document not found' });
//         }
//         const collaborator = await User.findOne({ email });
//         if (!collaborator) {
//             return res.status(404).json({ error: 'Collaborator not found' });
//         }
//         if (document.collaborators.includes(collaborator._id)) {
//             return res.status(409).json({ error: 'Collaborator already added' });
//         }
//         document.collaborators.push(collaborator._id);
//         await document.save();
//         res.status(200).json({ message: 'Collaborator added successfully' });
//     } catch (error) {
//         res.status(500).json({ error });
//     }
// };

exports.updateTitle = async (roomId, title) => {
    try {
        const document = await Document.findOne({ roomId }); // roomId로 찾음
        if (!document) {
            console.log("Document not found while updating title");
            return;
        }
        document.title = title;
        document.updatedAt = Date.now();
        await document.save();
        return document;
    } catch (error) {
        console.log("Error in updating doc title", error);
    }
};


// exports.isDocumentExist = async (uuid) => {
//     try {
//         if (uuid.length != 24) {
//             return false
//         }
//         const document = await Document.findOne({ _id: uuid });
//         if (!document) {
//             console.log("document not found")
//             return false;
//         }
//         return true
//     } catch (error) {
//         console.log("Error in finding document from database", error)
//     }
// }

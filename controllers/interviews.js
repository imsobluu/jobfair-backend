const Interview = require('../models/Interview');
const Company = require('../models/Company');

//@desc         Get all interviews
//@route        GET /api/v1/interviews
//@access       Public
exports.getInterviews = async (req, res, next) => {
    let query;
    
    //General users can only see their interviews
    if (req.user.role !== 'admin') {
        query = Interview.find({user:req.user.id}).populate({
            path: 'company',
            select: 'name address website description tel'
        });
    } else {
        if (req.params.companyId) {
            console.log(req.params.companyId);
            query = Interview.find({company: req.params.companyId}).populate({
                path: 'company',
                select: 'name address website description tel'
            });
        } else {
            query = Interview.find().populate({
                path: 'company',
                select: 'name address website description tel'
            });
        }
    }

    try {
        const interviews = await query;

        res.status(200).json({
            success: true,
            count: interviews.length,
            data: interviews
        });
    } catch(err) {
        console.log(err.stack);
        return res.status(500).json({success: false, message: 'Cannot find Interview'});
    }
};


//@desc         Get single interview 
//@route        GET /api/v1/interviews/:id
//@access       Public
exports.getInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findById(req.params.id). populate({
            path: 'company',
            select: 'name address website description tel'
        });

        if (!interview) {
            return res.status (404).json({success: false, message: `No interview with the id of ${req.params.id}`});
        }

        res.status(200).json({
            success: true,
            data: interview
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Cannot find Interview"});
    }
};


//@desc         Add interview
//@route        POST /api/v1/company/:companyId/interviews/
//@access       Private
exports.addInterview = async (req, res, next) => {
    try {
        req.body.company = req.params.companyId;

        const company = await Company.findById(req.params.companyId);

        if (!company) {
            return res.status (404).json({success: false, message: `No company with the id of ${req.params.companyId}`});
        }

        //add user Id to req.body req.body.user=req.user.id;
        req.body.user = req.user.id;

        //Check for existed interview
        const existedInterviews = await Interview.find({user: req.user.id});

        //If the user is not an admin, they can only create 3 interviews. 
        if (existedInterviews.length >= 3 && req.user.role !== 'admin') {
            return res.status(400).json({success: false, message: `The user with ID ${req.user.id} has already made 3 interviews`});
        };

        if (req.body.interviewDate < '2022-05-10T00:00:00.000+00:00' || req.body.interviewDate > '2022-05-13T23:59:59.999+00:00') {
            return res.status(400).json({success: false, message: `Please choose a date during May 10th - 13th, 2022`});
        }
     
        const interview = await Interview.create(req.body);

        res.status(201).json({
            success: true,
            data: interview
        });

    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Cannot create Interview"});
    }
};


//@desc         Update interview
//@route        PUT /api/v1/interviews/:id
//@access       Private
exports.updateInterview = async (req, res, next) => {
    try {
        let interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({success: false, message: `No interview with the id of ${req.params.id}`});
        }

        //Make sure user is the interview owner
        if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to update this interview`});
        }

        interview = await Interview.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            success: true,
            data: interview
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Cannot update Interview"});
    }
};


//@desc         Delete interview
//@route        DELETE /api/v1/interviews/:id
//@access       Private
exports.deleteInterview = async (req, res, next) => {
    try {
        const interview = await Interview.findById(req.params.id);

        if (!interview) {
            return res.status(404).json({success: false, message: `No interview with the id of ${req.params.id}`});
        }

        //Make sure user is the interview owner
        if (interview.user.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({success: false, message: `User ${req.user.id} is not authorized to delete this interview`});
        }

        await interview.deleteOne();

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({success: false, message: "Cannot delete interview"});
    }
};
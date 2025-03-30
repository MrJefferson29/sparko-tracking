const asyncErrorWrapper = require("express-async-handler")
const Story = require("../Models/story");
// const deleteImageFile = require("../Helpers/Libraries/deleteImageFile");
const {searchHelper, paginateHelper} =require("../Helpers/query/queryHelpers")



const addStory = async (req, res, next) => {
    const { title, content, address, status, time, packageName, location, weight, carrier, long, lat } = req.body;

    const wordCount = content.trim().split(/\s+/).length;
    const readtime = Math.floor(wordCount / 200);

    try {

        const newStory = await Story.create({
            title,
            content,
            address,
            status,
            time,
            packageName,
            location,
            long,
            lat,
            weight,
            carrier,
            author: req.user._id,
            readtime,
        });

        return res.status(200).json({
            success: true,
            message: "Story added successfully",
            data: newStory,
        });
    } catch (error) {
        console.error("Error adding story:", error);
        return next(error);
    }
};

const getAllStories = asyncErrorWrapper( async (req,res,next) =>{

    let query = Story.find();

    query =searchHelper("title",query,req)

    const paginationResult =await paginateHelper(Story , query ,req)

    query = paginationResult.query  ;

    query = query.sort("-likeCount -commentCount -createdAt")

    const stories = await query
    
    return res.status(200).json(
        {
            success:true,
            count : stories.length,
            data : stories ,
            page : paginationResult.page ,
            pages : paginationResult.pages
        })

})

const detailStory =asyncErrorWrapper(async(req,res,next)=>{

    const {slug}=req.params ;
    const {activeUser} =req.body 

    const story = await Story.findOne({
        slug: slug 
    }).populate("author likes")

    const storyLikeUserIds = story.likes.map(json => json.id)
    const likeStatus = storyLikeUserIds.includes(activeUser._id)


    return res.status(200).
        json({
            success:true,
            data : story,
            likeStatus:likeStatus
        })

})

const likeStory =asyncErrorWrapper(async(req,res,next)=>{

    const {activeUser} =req.body 
    const {slug} = req.params ;

    const story = await Story.findOne({
        slug: slug 
    }).populate("author likes")
   
    const storyLikeUserIds = story.likes.map(json => json._id.toString())
   
    if (! storyLikeUserIds.includes(activeUser._id)){

        story.likes.push(activeUser)
        story.likeCount = story.likes.length
        await story.save() ; 
    }
    else {

        const index = storyLikeUserIds.indexOf(activeUser._id)
        story.likes.splice(index,1)
        story.likeCount = story.likes.length

        await story.save() ; 
    }
 
    return res.status(200).
    json({
        success:true,
        data : story
    })

})

const editStoryPage = asyncErrorWrapper(async (req, res, next) => {
    const { slug } = req.params;
  
    const story = await Story.findOne({ slug }).populate("author likes");
  
    return res.status(200).json({
      success: true,
      data: story,
    });
  });
  
  const editStory = asyncErrorWrapper(async (req, res, next) => {
    const { slug } = req.params;
    const updates = req.body; // Contains the fields to update (e.g., just status)
  
    // Find the story by slug
    const story = await Story.findOne({ slug });
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
  
    // List of fields that can be updated
    const updatableFields = [
      "title",
      "content",
      "address",
      "status",
      "time",
      "packageName",
      "location",
      "weight",
      "carrier",
      "long",
      "lat",
    ];
  
    // Update only the fields provided in the request
    updatableFields.forEach((field) => {
      if (updates[field] !== undefined) {
        story[field] = updates[field];
      }
    });
  
    await story.save();
  
    return res.status(200).json({
      success: true,
      data: story,
    });
  });
  
const deleteStory  =asyncErrorWrapper(async(req,res,next)=>{

    const {slug} = req.params  ;

    const story = await Story.findOne({slug : slug }) 

    await story.remove()

    return res.status(200).
        json({
            success:true,
            message : "Story delete succesfully "
    })

})


module.exports ={
    addStory,
    getAllStories,
    detailStory,
    likeStory,
    editStoryPage,
    editStory ,
    deleteStory
}

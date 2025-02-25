var dt = table.filter(ee.Filter.eq('Dist_2019','Jalandhar')); 
Map.centerObject(dt,10);
// Load the GeoTIFF image from Earth Engine assets 
var tiffAssetID = 'users/gprsc2023/Jalandhar_Potato';
var tiffImage = ee.Image(tiffAssetID);
Map.addLayer(tiffImage, {}, 'Imported GeoTIFF Image'); 


function maskCloudAndshadowSR(image){
  var cloudProb = image.select('MSK_CLDPRB');
  var snowProb = image.select('MSK_SNWPRB');
  var cloud = cloudProb.lt(10);
  var snow = snowProb.lt(10);
  var scl = image.select('SCL');
  var shadow = scl.eq(3); //3 = clouds shadow
  var cirrus = scl.eq(10); // 10 = cirrus
  // Cloud prbability less than 5 % or cloud shadow classfication
  var mask = (cloud.and(snow)).and(cirrus.neq(1)).and(shadow.neq(1));
  return image.updateMask(mask).copyProperties(image,["system:time_start"]);
}
  
var worldCover = ee.Image('ESA/WorldCover/v200/2021');
var croplandMask = worldCover.eq(40); // Mask for cropland areas (class 40)

// Mask out non-cropland areas in the region of interest
var maskedCropland = croplandMask.updateMask(croplandMask).clip(dt);
//Map.addLayer(maskedCropland, {palette: ['green']}, 'Masked Cropland');

// Define a function to mask non-cropland areas in an image collection
var maskCropland = function(img) {
  return img.updateMask(maskedCropland);
};

//********************************************************************************************************
var coll_1 = ee.ImageCollection("COPERNICUS/S2_SR")
      .filterDate('2023-10-10', '2023-10-20')
      .filterBounds(dt)
      .map(maskCropland)
      .map(maskCloudAndshadowSR)
      .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 10);
      print(coll_1);
var coll_2 = ee.ImageCollection("COPERNICUS/S2_SR")
       .filterDate('2023-10-21', '2023-10-31')
      .filterBounds(dt)
      .map(maskCropland)
      .map(maskCloudAndshadowSR)
      .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 10);
      print(coll_2);
var coll_3 = ee.ImageCollection("COPERNICUS/S2_SR")
       .filterDate('2023-11-10', '2023-11-20')
      .filterBounds(dt)
      .map(maskCropland)
      .map(maskCloudAndshadowSR)
      .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 10);
      print(coll_3);
var coll_5 = ee.ImageCollection("COPERNICUS/S2_SR")
       .filterDate('2023-12-01', '2023-12-15')
      .filterBounds(dt)
      .map(maskCropland)
      .map(maskCloudAndshadowSR)
      .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 10);
      print(coll_5);
var coll_7 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
       .filterDate('2024-02-01', '2024-02-15')
      .filterBounds(dt)
      .map(maskCropland)
      .map(maskCloudAndshadowSR)
      .filterMetadata('CLOUDY_PIXEL_PERCENTAGE', 'less_than', 10);
      print(coll_7);



//print(coll8); 

var addNDVI = function(img){
 var ndvi = img.normalizedDifference(['B8','B4']).rename('NDVI')
 return img.addBands(ndvi);
}
var withNDVI1 = coll_1.map(addNDVI);
var withNDVI2 = coll_2.map(addNDVI);
var withNDVI3 = coll_3.map(addNDVI);
var withNDVI5 = coll_5.map(addNDVI);
var withNDVI7 = coll_7.map(addNDVI);
//print(withNDVI1,"withNDVI1");
var greenest1 = withNDVI1.qualityMosaic('NDVI').select(['B2','B3','B4','B5','B8','B11','B12']).clip(dt);
var greenest2 = withNDVI2.qualityMosaic('NDVI').select(['B2','B3','B4','B5','B8','B11','B12']).clip(dt);
var greenest3 = withNDVI3.qualityMosaic('NDVI').select(['B2','B3','B4','B5','B8','B11','B12']).clip(dt);
var greenest5 = withNDVI5.qualityMosaic('NDVI').select(['B2','B3','B4','B5','B8','B11','B12']).clip(dt);
var greenest7 = withNDVI7.qualityMosaic('NDVI').select(['B2','B3','B4','B5','B8','B11','B12']).clip(dt);

//print(greenest1,"greenest1");
// Map.addLayer(greenest1,{bands:['B8','B4','B3'],min:0,max:5000},'Sen_Oct1FN');
// Map.addLayer(greenest2,{bands:['B8','B4','B3'],min:0,max:5000},'Sen_Oct2FN');
//Map.addLayer(greenest3,{bands:['B8','B4','B3'],min:0,max:5000},'Sen_Nov1FN');
Map.addLayer(greenest5,{bands:['B8','B4','B3'],min:0,max:5000},'Sen_DEC1FN');
//Map.addLayer(greenest7,{bands:['B8','B4','B3'],min:0,max:5000},'Sen_FEB2FN');

var ndvi1 = greenest1.normalizedDifference(['B8','B4']).rename('NDVI1_oct');
var ndvi2 = greenest2.normalizedDifference(['B8','B4']).rename('NDVI2_oct');
var ndvi3 = greenest3.normalizedDifference(['B8','B4']).rename('NDVI3_nov');
var ndvi5 = greenest5.normalizedDifference(['B8','B4']).rename('NDVI5_dec');
var ndvi7 = greenest7.normalizedDifference(['B8','B4']).rename('NDVI7_feb');

// create Stacked Ndvi
var stacked_ndvi = ndvi1.addBands([ndvi2, ndvi3,ndvi5,ndvi7]);
Map.addLayer(stacked_ndvi, {bands:['NDVI2_oct', 'NDVI5_dec', 'NDVI3_nov'], min:-1, max:1}, 'Stacked NDVI');

print(stacked_ndvi,"stacked_ndvi");

//*********************************************************************
 // Scale values to 0-1
var g1 = greenest1.select(['B11', 'B5']).rename('g4_b11','g4_b5');
var g2 = greenest2.select(['B11', 'B5']).rename('g4_b11','g4_b5');
var g3 = greenest3.select(['B11', 'B5']).rename('g4_b11','g4_b5');
var g5 = greenest5.select(['B11', 'B5']).rename('g5_b11','g5_b5');
var g7 = greenest7.select(['B11', 'B5']).rename('g6_b11','g6_b5');
stacked_ndvi = stacked_ndvi.addBands([g1, g2, g3, g5,g7]);
print(stacked_ndvi,"stacked_ndvi");

//***************************************************************************
var training = stacked_ndvi.sample({
  region: dt,
  scale: 300,
  numPixels: 10000 // Increases efficiency
});
//***************************************************************************
var clusterer = ee.Clusterer.wekaKMeans(10).train(training);
var clustered = stacked_ndvi.cluster(clusterer);
// Get unique cluster values
var clusterValues = clustered.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: dt.geometry(),
  scale: 10,
  maxPixels: 1e10
});

print("Detected cluster 10 values:", clusterValues);
Map.addLayer(clustered.randomVisualizer(), {}, 'K-Means Clustering');
// choose the correct patch for potato
var cluster0 = clustered.eq(6);
var cluster1 = clustered.eq(2);
 Map.addLayer(cluster0.updateMask(cluster0),{min: 0, max: 1, palette: ['green']}, 'cluster0');
Map.addLayer(cluster1.selfMask(),{min: 0, max: 1, palette: ['yellow']}, 'cluster1');


//**************************Xmeans clustering for subclustering ****************************
// Step 1: Extract pixels belonging to cluster0
var cluster0Samples = stacked_ndvi.updateMask(cluster0).sample({
  region: dt,  // Your area of interest
  scale: 300,  
  numPixels: 3000
});

// Step 2: Train X-Means model on the extracted samples
var xMeansClusterer = ee.Clusterer.wekaXMeans().train(cluster0Samples);

// Step 3: Apply the trained model to recluster cluster0
var subClustered = stacked_ndvi.cluster(xMeansClusterer).updateMask(cluster0);

// Get unique cluster values
var clusterValues = subClustered.reduceRegion({
  reducer: ee.Reducer.frequencyHistogram(),
  geometry: dt.geometry(),
  scale: 30,
  maxPixels: 1e10
});

print("Detected cluster values:", clusterValues);

// Step 4: Visualize the sub-clusters
Map.addLayer(subClustered.randomVisualizer(), {}, 'Sub-Clusters of Cluster 6');

//Area Calculation
var potato = clustered.eq(6);
//Counting number of pixels in class and area  
var class_pix1=potato
        .multiply(ee.Image.pixelArea())
        .reduceRegion({
          reducer: ee.Reducer.sum(),
        geometry: dt,
        maxPixels: 1e9,
        scale:10
          })
        .get('cluster');

print('Total detected Potato fields in Ha: ')
print(ee.Number.parse(class_pix1).divide(1000));


Map.addLayer(cluster1.selfMask(), {palette: ['blue']}, 'Cluster3');
Export.image.toDrive({
  image: potatoCluster1,
  description: 'Sub_Potato',
  scale: 10, // Adjust the scale according to your preference
  region: dt, // Define the region of interest
  crs: 'EPSG:4326', // Define the projection
  
  
});

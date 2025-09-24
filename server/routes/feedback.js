const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { admin } = require('../config/firebase');

// Create feedback form (Admin only)
router.post('/forms', verifyToken, requireAdmin, async (req, res) => {
  try {
    const {
      title,
      description,
      googleFormUrl,
      targetAudience = 'all', // 'all', 'class', 'department'
      classIds = [],
      departmentIds = [],
      startDate,
      endDate,
      isActive = true,
      questions = [] // For custom forms
    } = req.body;

    const formData = {
      title,
      description,
      googleFormUrl: googleFormUrl || null,
      targetAudience,
      classIds: targetAudience === 'class' ? classIds : [],
      departmentIds: targetAudience === 'department' ? departmentIds : [],
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      isActive,
      questions: questions || [],
      createdBy: req.user.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      responseCount: 0,
      type: googleFormUrl ? 'google_form' : 'custom_form'
    };

    const docRef = await admin.firestore().collection('feedback_forms').add(formData);
    
    res.status(201).json({
      message: 'Feedback form created successfully',
      id: docRef.id,
      ...formData
    });
  } catch (error) {
    console.error('Error creating feedback form:', error);
    res.status(500).json({ error: 'Failed to create feedback form' });
  }
});

// Get feedback forms for admin
router.get('/forms', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, type } = req.query;
    
    let query = admin.firestore().collection('feedback_forms');
    
    if (status === 'active') {
      query = query.where('isActive', '==', true);
    } else if (status === 'inactive') {
      query = query.where('isActive', '==', false);
    }
    
    if (type) {
      query = query.where('type', '==', type);
    }

    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const forms = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      forms.push({
        id: doc.id,
        ...data,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate()
      });
    }

    res.json(forms);
  } catch (error) {
    console.error('Error fetching feedback forms:', error);
    res.status(500).json({ error: 'Failed to fetch feedback forms' });
  }
});

// Get feedback forms for students
router.get('/forms/student', verifyToken, async (req, res) => {
  try {
    // Verify user is a student
    const studentDoc = await admin.firestore().collection('students').doc(req.user.uid).get();
    if (!studentDoc.exists || !studentDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied or account inactive' });
    }

    const studentData = studentDoc.data();
    const now = new Date();
    
    // Get active forms that apply to this student
    const snapshot = await admin.firestore()
      .collection('feedback_forms')
      .where('isActive', '==', true)
      .get();

    const applicableForms = [];
    
    for (const doc of snapshot.docs) {
      const formData = doc.data();
      
      // Check if form is within date range
      if (formData.startDate && now < formData.startDate.toDate()) continue;
      if (formData.endDate && now > formData.endDate.toDate()) continue;
      
      // Check if form applies to this student
      let applies = false;
      
      if (formData.targetAudience === 'all') {
        applies = true;
      } else if (formData.targetAudience === 'class') {
        applies = formData.classIds.includes(studentData.classId);
      } else if (formData.targetAudience === 'department') {
        applies = formData.departmentIds.includes(studentData.department);
      }
      
      if (applies) {
        // Check if student has already responded
        const responseSnapshot = await admin.firestore()
          .collection('feedback_responses')
          .where('formId', '==', doc.id)
          .where('studentId', '==', req.user.uid)
          .get();
        
        const hasResponded = !responseSnapshot.empty;
        
        applicableForms.push({
          id: doc.id,
          ...formData,
          startDate: formData.startDate?.toDate(),
          endDate: formData.endDate?.toDate(),
          createdAt: formData.createdAt?.toDate(),
          hasResponded
        });
      }
    }

    res.json(applicableForms);
  } catch (error) {
    console.error('Error fetching student feedback forms:', error);
    res.status(500).json({ error: 'Failed to fetch feedback forms' });
  }
});

// Get specific feedback form
router.get('/forms/:formId', verifyToken, async (req, res) => {
  try {
    const { formId } = req.params;
    
    const formDoc = await admin.firestore()
      .collection('feedback_forms')
      .doc(formId)
      .get();
    
    if (!formDoc.exists) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    
    const formData = formDoc.data();
    
    // Check permissions
    if (req.user.role === 'student') {
      const studentDoc = await admin.firestore().collection('students').doc(req.user.uid).get();
      if (!studentDoc.exists || !studentDoc.data().isActive) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const studentData = studentDoc.data();
      const now = new Date();
      
      // Check if form applies to this student and is active
      if (!formData.isActive) {
        return res.status(403).json({ error: 'Form is no longer active' });
      }
      
      if (formData.startDate && now < formData.startDate.toDate()) {
        return res.status(403).json({ error: 'Form is not yet available' });
      }
      
      if (formData.endDate && now > formData.endDate.toDate()) {
        return res.status(403).json({ error: 'Form has expired' });
      }
      
      // Check target audience
      let applies = false;
      if (formData.targetAudience === 'all') {
        applies = true;
      } else if (formData.targetAudience === 'class') {
        applies = formData.classIds.includes(studentData.classId);
      } else if (formData.targetAudience === 'department') {
        applies = formData.departmentIds.includes(studentData.department);
      }
      
      if (!applies) {
        return res.status(403).json({ error: 'This form is not available for you' });
      }
    }
    
    res.json({
      id: formDoc.id,
      ...formData,
      startDate: formData.startDate?.toDate(),
      endDate: formData.endDate?.toDate(),
      createdAt: formData.createdAt?.toDate()
    });
  } catch (error) {
    console.error('Error fetching feedback form:', error);
    res.status(500).json({ error: 'Failed to fetch feedback form' });
  }
});

// Submit feedback response (Student only)
router.post('/forms/:formId/responses', verifyToken, async (req, res) => {
  try {
    const { formId } = req.params;
    const { responses, rating = null, comments = '' } = req.body;
    
    // Verify user is a student
    const studentDoc = await admin.firestore().collection('students').doc(req.user.uid).get();
    if (!studentDoc.exists || !studentDoc.data().isActive) {
      return res.status(403).json({ error: 'Access denied or account inactive' });
    }
    
    // Get form details
    const formDoc = await admin.firestore()
      .collection('feedback_forms')
      .doc(formId)
      .get();
    
    if (!formDoc.exists) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    
    const formData = formDoc.data();
    
    if (!formData.isActive) {
      return res.status(400).json({ error: 'Form is no longer active' });
    }
    
    // Check if already responded
    const existingResponse = await admin.firestore()
      .collection('feedback_responses')
      .where('formId', '==', formId)
      .where('studentId', '==', req.user.uid)
      .get();
    
    if (!existingResponse.empty) {
      return res.status(409).json({ error: 'You have already submitted feedback for this form' });
    }
    
    // For Google Forms, just record that they responded
    const responseData = {
      formId,
      studentId: req.user.uid,
      responses: formData.type === 'google_form' ? null : responses,
      rating: rating ? parseInt(rating) : null,
      comments,
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      formType: formData.type
    };
    
    const responseRef = await admin.firestore()
      .collection('feedback_responses')
      .add(responseData);
    
    // Update form response count
    await admin.firestore()
      .collection('feedback_forms')
      .doc(formId)
      .update({
        responseCount: admin.firestore.FieldValue.increment(1)
      });
    
    res.status(201).json({
      message: 'Feedback submitted successfully',
      responseId: responseRef.id
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get feedback responses for a form (Admin only)
router.get('/forms/:formId/responses', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { formId } = req.params;
    
    // Check if form exists
    const formDoc = await admin.firestore()
      .collection('feedback_forms')
      .doc(formId)
      .get();
    
    if (!formDoc.exists) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    
    const snapshot = await admin.firestore()
      .collection('feedback_responses')
      .where('formId', '==', formId)
      .orderBy('submittedAt', 'desc')
      .get();
    
    const responses = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Get student details
      const studentDoc = await admin.firestore()
        .collection('students')
        .doc(data.studentId)
        .get();
      
      responses.push({
        id: doc.id,
        ...data,
        student: studentDoc.exists ? {
          name: studentDoc.data().name,
          rollNumber: studentDoc.data().rollNumber,
          department: studentDoc.data().department,
          semester: studentDoc.data().semester
        } : null,
        submittedAt: data.submittedAt?.toDate()
      });
    }
    
    // Calculate statistics
    const totalResponses = responses.length;
    const averageRating = responses.length > 0 ? 
      responses.filter(r => r.rating).reduce((sum, r) => sum + r.rating, 0) / 
      responses.filter(r => r.rating).length : 0;
    
    // Group by department/class for insights
    const departmentStats = {};
    responses.forEach(response => {
      if (response.student?.department) {
        if (!departmentStats[response.student.department]) {
          departmentStats[response.student.department] = {
            count: 0,
            totalRating: 0,
            ratingCount: 0
          };
        }
        departmentStats[response.student.department].count++;
        if (response.rating) {
          departmentStats[response.student.department].totalRating += response.rating;
          departmentStats[response.student.department].ratingCount++;
        }
      }
    });
    
    // Calculate average ratings per department
    Object.keys(departmentStats).forEach(dept => {
      const stats = departmentStats[dept];
      stats.averageRating = stats.ratingCount > 0 ? 
        Math.round((stats.totalRating / stats.ratingCount) * 100) / 100 : 0;
    });
    
    res.json({
      responses,
      statistics: {
        totalResponses,
        averageRating: Math.round(averageRating * 100) / 100,
        departmentStats
      }
    });
  } catch (error) {
    console.error('Error fetching feedback responses:', error);
    res.status(500).json({ error: 'Failed to fetch feedback responses' });
  }
});

// Update feedback form (Admin only)
router.put('/forms/:formId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { formId } = req.params;
    
    const updateData = { ...req.body };
    delete updateData.createdBy;
    delete updateData.responseCount;
    
    if (updateData.startDate) {
      updateData.startDate = new Date(updateData.startDate);
    }
    
    if (updateData.endDate) {
      updateData.endDate = new Date(updateData.endDate);
    }
    
    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    updateData.updatedBy = req.user.uid;
    
    await admin.firestore()
      .collection('feedback_forms')
      .doc(formId)
      .update(updateData);
    
    res.json({ message: 'Feedback form updated successfully' });
  } catch (error) {
    console.error('Error updating feedback form:', error);
    res.status(500).json({ error: 'Failed to update feedback form' });
  }
});

// Delete feedback form (Admin only)
router.delete('/forms/:formId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { formId } = req.params;
    
    // Delete all responses first
    const responsesSnapshot = await admin.firestore()
      .collection('feedback_responses')
      .where('formId', '==', formId)
      .get();
    
    const batch = admin.firestore().batch();
    
    responsesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the form
    batch.delete(admin.firestore().collection('feedback_forms').doc(formId));
    
    await batch.commit();
    
    res.json({ message: 'Feedback form and all responses deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback form:', error);
    res.status(500).json({ error: 'Failed to delete feedback form' });
  }
});

// Get feedback analytics (Admin only)
router.get('/analytics', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, formType } = req.query;
    
    let formsQuery = admin.firestore().collection('feedback_forms');
    let responsesQuery = admin.firestore().collection('feedback_responses');
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      responsesQuery = responsesQuery
        .where('submittedAt', '>=', start)
        .where('submittedAt', '<=', end);
    }
    
    if (formType) {
      formsQuery = formsQuery.where('type', '==', formType);
    }
    
    const [formsSnapshot, responsesSnapshot] = await Promise.all([
      formsQuery.get(),
      responsesQuery.get()
    ]);
    
    const forms = formsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    const responses = responsesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate()
    }));
    
    // Analytics calculations
    const totalForms = forms.length;
    const activeForms = forms.filter(f => f.isActive).length;
    const totalResponses = responses.length;
    const averageResponsesPerForm = totalForms > 0 ? 
      Math.round((totalResponses / totalForms) * 100) / 100 : 0;
    
    // Response trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentResponses = responses.filter(r => 
      r.submittedAt && r.submittedAt >= thirtyDaysAgo
    );
    
    // Group responses by date for trends
    const responseTrends = {};
    recentResponses.forEach(response => {
      const dateKey = response.submittedAt.toISOString().split('T')[0];
      responseTrends[dateKey] = (responseTrends[dateKey] || 0) + 1;
    });
    
    // Form performance
    const formPerformance = {};
    forms.forEach(form => {
      const formResponses = responses.filter(r => r.formId === form.id);
      formPerformance[form.id] = {
        title: form.title,
        responseCount: formResponses.length,
        averageRating: formResponses.length > 0 ? 
          formResponses.filter(r => r.rating).reduce((sum, r) => sum + r.rating, 0) / 
          Math.max(formResponses.filter(r => r.rating).length, 1) : 0
      };
    });
    
    res.json({
      overview: {
        totalForms,
        activeForms,
        totalResponses,
        averageResponsesPerForm
      },
      trends: {
        responseTrends,
        recentResponseCount: recentResponses.length
      },
      formPerformance: Object.values(formPerformance)
    });
  } catch (error) {
    console.error('Error generating feedback analytics:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

// Toggle form active status (Admin only)
router.patch('/forms/:formId/toggle-status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { formId } = req.params;
    
    const formDoc = await admin.firestore()
      .collection('feedback_forms')
      .doc(formId)
      .get();
    
    if (!formDoc.exists) {
      return res.status(404).json({ error: 'Feedback form not found' });
    }
    
    const currentStatus = formDoc.data().isActive;
    
    await admin.firestore()
      .collection('feedback_forms')
      .doc(formId)
      .update({
        isActive: !currentStatus,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedBy: req.user.uid
      });
    
    res.json({ 
      message: `Form ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      isActive: !currentStatus
    });
  } catch (error) {
    console.error('Error toggling form status:', error);
    res.status(500).json({ error: 'Failed to toggle form status' });
  }
});

module.exports = router;
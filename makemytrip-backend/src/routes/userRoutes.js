import { Router } from 'express'
import { getProfile, updateProfile } from '../controllers/userController.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/profile', authenticate, getProfile)
router.put('/update', authenticate, updateProfile)

export default router
